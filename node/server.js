var express = require('express'),
    app     = express.createServer(),
    io      = require('socket.io').listen(app),

    qs      = require('querystring'),
    sio     = require('socket.io'),
    crypto  = require('crypto');

// local modules
var GameManager = require('./app/game_manager');
var SocketBot   = require('./app/socket_bot');
var db          = require('./app/db');

app.listen(7979);

require('./app/routes')(app);

app.configure(function() {
    app.use(express.static(__dirname + '/../public'));
    app.set('view engine', 'jade');
    app.set('view options', {
        'layout': false
    });
});

io.configure(function() {
    io.set('transports', ['websocket']);
    io.set('log level', 1); // warn
});

io.configure('development', function() {
    console.log("configuring development options");
    io.set('log level', 2); // info
});

// keep a cached copy of all authed (lobby, in game) users
var authedUsers = {};

// keep a copy of any outstanding challenges between players
var challenges = [];

// keep a copy of all active games in progress
var games = {};

// cache the last 10 or so chat lines
var chatlines = [];

// weapon types
var weapons = {
    "0" : {
        "reload"  : 2000,
        "bullets" : 1,
        "fuzz"    : 0
    },
    "1" : {
        "reload"  : 3000,
        "bullets" : 4,
        "fuzz"    : 5 
    }
};

// powerup types
var powerups = {
    "0" : {
        "letter": "T"
    },
    "1" : {
        "letter": "S"
    },
    "2" : {
        "letter": "P"
    }
};

// keep track of the active powerups in each game
var activePowerups = {};

io.sockets.on('connection', function(socket) {
    socket.emit('statechange', 'login');

    /**
     * login
     */
    socket.on('login', function(data) {
        var details = qs.parse(data);
        db.collection('users', function(err, collection) {

            var hash = crypto.createHash('sha1');
            hash.update(details.password);
            details.password = hash.digest('hex');

            collection.findOne(details, function(err, result) {
                if (result == null) {
                    socket.emit('msg', 'Sorry, these details don\'t appear to be valid. Please try again.');
                } else {
                    duplicateLogin = false;
                    for (var i in authedUsers) {
                        if (authedUsers[i].username == result.username) {
                            duplicateLogin = true;
                            break;
                        }
                    }
                    if (duplicateLogin) {
                        socket.emit('msg', 'Sorry, this user already appears to be logged in. Please try again.');
                    } else {
                        collection.update({_id: result._id}, {$set: {lastLogin: new Date()}});
                        result.sid = socket.id;
                        delete result.password;
                        authedUsers[socket.id] = result;
                        socket.join('lobby');
                        socket.emit('statechange', 'lobby');
                        socket.broadcast.to('lobby').emit('lobby:user:join', result);
                        botChat(authedUsers[socket.id].username+" joined the lobby");
                    }
                }
            });
        });
    });

    /**
     * login -> register
     */
    socket.on('login:register', function() {
        socket.emit('statechange', 'register');
    });

    /**
     * register - do registration
     */
    socket.on('register:register', function(data) {
        function validateEmail(email) { 
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        } 
        var details = qs.parse(data);

        var errors = [];
        if (details.username == null ||
            details.username.match(/^[A-z_0-9]{1,20}$/) == null) {
            errors.push("Please enter a valid username");
        }
        if (details.email == null ||
            validateEmail(details.email) == false) {
            errors.push("Please enter a valid email address");
        }
        if (details.password == null ||
            details.password.match(/^.{4,20}$/) == null) {
            errors.push("Please enter a valid password");
        }
        if (errors.length) {
            socket.emit('msg', errors.join("<br />"));
            return;
        }
        db.collection('users', function(err, collection) {
            collection.findOne({ $or : [{"username": details.username}, {"email": details.email}]}, function(err, result) {
                if (result == null) {
                    // superb. register
                    var hash = crypto.createHash('sha1');
                    hash.update(details.password);
                    details.password = hash.digest('hex');
                    details.rank = 0;
                    details.kills = 0;
                    details.deaths = 0;
                    details.defaults = 0;
                    details.wins = 0;
                    details.losses = 0;
                    details.registered = new Date();
                    collection.insert(details);
                    socket.emit('msg', 'Congratulations, you\'re registered!');
                    socket.emit('statechange', 'login');
                } else {
                    socket.emit('msg', 'Sorry, that username or email address is already in use.');
                }
            });
        });
    });

    /**
     * lobby / user list
     */
    socket.on('lobby:ready', function() {
        var _sockets = io.sockets.clients('lobby');
        var users = [];
        for (var i = 0, j = _sockets.length; i < j; i++) {
            users.push(authedUsers[_sockets[i].id]);
        }

        // simply convert the games object to an array
        var activeGames = [];
        for (var i in games) {
            if (games[i].started != null) {
                // we only care about games which have been *started*, not necessarily "created"
                activeGames.push(games[i]);
            }
        }

        socket.emit('lobby:users', {
            "timestamp": new Date(),
            "user": authedUsers[socket.id],
            "users": users,
            "games": activeGames,
            "chatlines": chatlines
        });
    });

    /**
     * lobby banter
     */
    socket.on('lobby:chat', function(msg) {
        lobbyChat(authedUsers[socket.id], msg);
    });
        

    /**
     * receive challenge request
     */
    socket.on('lobby:challenge:issue', function(to) {
        // make sure the ID we're challenging is in the lobby
        // FIXME this line won't work - this gets us all sockets
        var _sockets = io.sockets.in('lobby').sockets;
        if (_sockets[to] != null) {
            var challenge = findChallenge('any', to);
            if (challenge == null) {
                // excellent! Issue the challenge from the challenger's user object
                challenges.push({
                    "from" : socket.id,
                    "to"   : to 
                });
                _sockets[to].emit('lobby:challenge:receive', authedUsers[socket.id]);
                socket.emit('lobby:challenge:confirm', to);
            } else {
                // can't challenge, already got one
                console.log('Cannot issue challenge - ID already has one outstanding');
                socket.emit('lobby:challenge:blocked');
            }
        } else {
            console.log("Could not find ID to challenge in lobby "+to);
        }
    });

    /**
     * process challenge response
     */
    socket.on('lobby:challenge:respond', function(accepted) {

        // the third arg here deletes the challenge from the challenges array
        var challenge = findChallenge('to', socket.id, true);

        if (challenge != null) {
            console.log("challenge from "+challenge.from+" to "+challenge.to+": "+accepted);
            var _sockets = [
                io.sockets.sockets[challenge.to],
                io.sockets.sockets[challenge.from]
            ];
            if (accepted) {
                db.collection('games', function(err, collection) {
                    
                    var game = {
                        "created"       : new Date(),
                        "started"       : null,
                        "challenger" : {
                            "db_id"     : authedUsers[challenge.from]._id,
                            "username"  : authedUsers[challenge.from].username,
                            "socket_id" : challenge.from,
                            "platform"  : GameManager.getRandomPlatform(),
                            "x"         : 16,
                            "a"         : 315,
                            "v"         : Math.floor(Math.random()* 150) + 25,
                            "score"     : 0
                        },
                        "challengee" : {
                            "db_id"     : authedUsers[challenge.to]._id,
                            "username"  : authedUsers[challenge.to].username,
                            "socket_id" : challenge.to,
                            "platform"  : GameManager.getRandomPlatform(),
                            "x"         : 908,
                            "a"         : 225,
                            "v"         : Math.floor(Math.random()* 150) + 25,
                            "score"     : 0
                        },
                        "entityId" : 0,
                        "duration": 90,
                        "cancelled": false
                    };
                    collection.insert(game, function(err, result) {
                        game = result[0];
                        games[game._id] = game;
                    });
                });

                for (var i = 0; i < 2; i++) {
                    _sockets[i].leave('lobby');
                    // @todo can we actually hook into event listeners on join / leave instead? probably...
                    io.sockets.emit('user:leave', _sockets[i].id);
                }
            }
            for (var i = 0; i < 2; i++) {
                _sockets[i].emit('lobby:challenge:response', {
                    "accepted": accepted,
                    "to": socket.id
                });
            }
        } else {
            console.log("Could not find challenge");
        }
    });

    /**
     * lobby - got bored waiting, cancel challenge
     */
    socket.on('lobby:challenge:cancel', function(to) {
        var challenge = findChallenge('to', to, true);
        if (challenge == null) {
            console.log("invalid challenge");
            socket.emit("lobby:challenge:cancel:invalid");
            return;
        }

        console.log("challenge from "+challenge.from+" to "+challenge.to+": cancelled");
        if (io.sockets.sockets[challenge.to]) {
            // feasibly, a reason the challenger withdrew is because the opponent left
            // @todo perhaps handle this globally - e.g delete the challenge object
            // when a user leaves instead?
            io.sockets.sockets[challenge.to].emit("lobby:challenge:cancel");
        }
    });

    /**
     * game start request
     */
    socket.on('lobby:startgame', function() {
        // is this user allowed - e.g. do they have an active game?
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            socket.emit('statechange', 'game');
        } else {
            console.log("could not find game for socket ID "+socket.id);
        }
    });

    /**
     * game - client ready
     */
    socket.on('game:ready', function() {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            console.log("Socket ID "+socket.id+" ready to play game ID "+game._id);
            socket.join("game_"+game._id);

            var _sockets = io.sockets.clients('game_'+game._id);
            console.log("players present: "+_sockets.length);
            if (_sockets.length == 2) {
                game.started = new Date();

                botChat("Game on! "+game.challenger.username+" Vs "+game.challengee.username, 'game');

                for (var i = 0; i < 2; i++) {
                    _sockets[i].emit('game:start', {
                        "user": authedUsers[_sockets[i].id],
                        "challenger": game.challenger,
                        "challengee": game.challengee,
                        "started"   : game.started,
                        "duration"  : game.duration
                    });
                }

                // notify the lobby dwellers
                io.sockets.in('lobby').emit('lobby:game:start', game);
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:ready");
        }
    });

    /**
     * game - request a shot (exciting)
     */
    socket.on('game:weapon:fire', function(options) {
        var game = findGameForSocketId(socket.id);
        if (game != null) {

            var player = socket.id == game.challenger.socket_id ? game.challenger : game.challengee;
            var now = new Date().getTime();
            // when did they last fire?
            player.firedAt = player.firedAt ? player.firedAt : 0;
            player.weapon = player.weapon ? player.weapon : 0;

            if (now >= player.firedAt + weapons[player.weapon].reload) {
                // ok, go for it - but add a few options
                player.firedAt = now;

                options.x = player.x;
                options.o = socket.id;
                options.platform = player.platform;
                options.reloadIn = weapons[player.weapon].reload;

                var bullets = [];
                for (var i = 0; i < weapons[player.weapon].bullets; i++) {
                    var fuzz = 0;
                    if (weapons[player.weapon].fuzz) {
                        fuzz = (-weapons[player.weapon].fuzz + Math.random()*weapons[player.weapon].fuzz);
                    }
                    bullets.push({
                        "a" : options.a + fuzz,
                        "v" : options.v + fuzz,
                        "id": ++game.entityId
                    });
                }

                options.bullets = bullets;

                trackGameEvent(game, 'weapon_fire', options);

                io.sockets.in('game_'+game._id).emit('game:weapon:fire', options);
            } else {
                var reload = (player.firedAt + weapons[player.weapon].reload - now);
                console.log("socket "+socket.id+" trying to fire too early: wait "+reload+" ms");
                socket.emit('game:weapon:fire:wait', reload);
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:bullet:spawn");
        }
    });

    /**
     * game - bullet has killed opponent
     */
    socket.on('game:player:kill', function(data) {
        /**
         * @todo - verify authenticity of the kill request!
         */
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            if (game.isFinished == null) {
                var killer = game.challenger.socket_id == data.id ? game.challengee : game.challenger; 
                killer.score ++;

                var respawn = game.suddendeath ? false : true;

                var data = {
                    "id": data.id,
                    "scores": [
                        game.challenger.score,
                        game.challengee.score
                    ],
                    "eId": data.eId,
                    "doRespawn": respawn
                };

                trackGameEvent(game, 'player_kill', data);

                io.sockets.in('game_'+game._id).emit('game:player:kill', data);
                io.sockets.in('lobby').emit('lobby:game:scorechange', {
                    "id": game._id,
                    "player": killer.socket_id == game.challenger.socket_id ? "challenger" : "challengee",
                    "score": killer.score
                });
                if (game.suddendeath) {
                    endGame(game);
                }
            } else {
                console.log("ignoring kill for finished game");
            }

        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:player:kill");
        }
    });

    /**
     * game - player is requesting respawn. no ID needed as we will infer it
     */
    socket.on('game:player:respawn', function() {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            respawnGamePlayer(game, socket);
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:player:respawn");
        }
    });

    /**
     * game - player banter
     */
    socket.on('game:player:chat', function(msg) {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            var data = {
                "id" : socket.id,
                "msg": msg
            };
            trackGameEvent(game, 'player_chat', data);
            io.sockets.in('game_'+game._id).emit('game:player:chat', data);
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:player:chat");
        }
    });

    socket.on('game:powerup:spawn', function() {
        // let's spawn a random powerup
        // @todo FIXME replace hard coded stuff
        // how are we going to get round the fact that the server doesn't know the dimensions of the canvas?
        // easiest I suppose is to deal with a more abstract unit, e.g. metres or percentages...
        var x = Math.floor(Math.random()*801) + 75;
        var y = Math.floor(Math.random()*521) + 20;
        // @see #575
        //var t = Math.floor(Math.random()*3);
        var t = 0;
        var r = 10;

        var game = findGameForSocketId(socket.id);
        if (game != null) {
            var powerup = {
                "x": x,
                "y": y,
                "type": t,
                "letter": powerups[t].letter,
                "r": r,
                "id": ++game.entityId
            };
            if (activePowerups[game._id] == null) {
                activePowerups[game._id] = [];
            }

            if (activePowerups[game._id].length < 3) {
                activePowerups[game._id].push(powerup);
                console.log("adding powerup to game stack", powerup);
                trackGameEvent(game, 'powerup_spawn', powerup);
                io.sockets.in('game_'+game._id).emit('game:powerup:spawn', powerup);
            } else {
                console.log("not spawning powerup - too many active");
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:powerup:spawn");
        }
    });

    socket.on('game:powerup:claim', function(options) {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            var powerups = activePowerups[game._id];
            if (powerups == null) {
                console.log("no powerups found for game "+game._id);
                return;
            } else {
                // great, got powerups. is the one we're claiming valid?
                for (var i = 0; i < powerups.length; i++) {
                    if (powerups[i].id == options.id) {
                        var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee;

                        var data = {
                            "id": powerups[i].id,
                            "eId": options.eId,
                        }
                        trackGameEvent(game, 'powerup_claim', data);
                        io.sockets.in('game_'+game._id).emit('game:powerup:claim', data);
                        // got it!
                        // what does it do?
                        console.log("player claiming powerup type "+powerups[i].type);
                        if (powerups[i].type == 0) {
                            // teleport
                            respawnGamePlayer(game, socket, true);
                        } else if (powerups[i].type == 1) {
                            // shotgun
                            player.weapon = 1;
                            socket.emit("game:weapon:change", 1);
                        } else if (powerups[i].type == 2) {
                            // pistol
                            player.weapon = 0;
                            socket.emit("game:weapon:change", 0);
                        }

                        powerups.splice(i, 1);
                        break;
                    }
                }
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:powerup:claim");
        }
    });

    /**
     * game - player thinks time is up
     */
    socket.on('game:timeup', function(msg) {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            if (game.timeup == null) {
                var elapsed = (new Date().getTime() - game.started) / 1000;
                if (elapsed >= game.duration) {
                    console.log("game time is UP! Elapsed: "+elapsed+" Vs Duration: "+game.duration);
                    game.timeup = true;
                    if (game.challenger.score != game.challengee.score) {
                        // excellent, we have a winner
                        endGame(game);
                    } else {
                        // draw - sudden death
                        game.suddendeath = true;
                        console.log("scores are tied - sudden death mode");
                        io.sockets.in('game_'+game._id).emit('game:suddendeath');
                    }
                } else {
                    console.log("client reported incorrect game timeup "+elapsed+" Vs "+game.duration);

                    // let the client know, in millis, when to ask for the game end again.
                    var remaining = Math.round((game.duration - elapsed)*1000);
                    socket.emit('game:timeup:rejected', remaining);
                }
            } else {
                console.log("ignoring duplicate game:timeup message");
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:timeup");
        }
    });

    /**
     * game - player is all done, ready for next state
     */
    socket.on('game:finish', function() {
        rejoinLobby(socket);
    });

    /**
     * disconnect / cleanup
     */
    socket.on('disconnect', function() {
        // get rid of this user from the active user array
        if (authedUsers[socket.id] != null) {
            botChat(authedUsers[socket.id].username+" left");

            // did the user have any outstanding challenges?
            findChallenge('any', socket.id, true);

            // was this user in a game? cancel it if so.
            var game = findGameForSocketId(socket.id);
            if (game != null) {
                cancelGame(game, authedUsers[socket.id]);
            }

            delete authedUsers[socket.id];
        }

        io.sockets.emit('user:leave', socket.id);
    });
});

db.open(function(err, client) {
    if (err) {
        console.log("error opening mongoDb connection "+err);
        throw err;
    }
});

function findGameForSocketId(sid) {
    for (var i in games) {
        if (games[i].challenger.socket_id == sid ||
            games[i].challengee.socket_id == sid) {
            return games[i];
        }
    }
    return null;
}

// retrieve actual player objects from collection
function getGamePlayers(game, cb) {
    var players = null;
    db.collection('users', function(err, collection) {
        collection.find({ $or : [{"_id": game.challenger.db_id}, {"_id": game.challengee.db_id}]}, function(err, cursor) {
            cursor.toArray(function(err, docs) {
                cb(docs);
            });
        });
    });
}

// an individual socket will cancel a game
function cancelGame(game, authedUser) {
    if (game.isFinished) {
        console.log("not cancelling game - already finished!");
        return;
    }

    var player, opponent;
    var pScore, oScore;

    player = authedUser;

    if (authedUser.sid == game.challenger.socket_id) {
        pScore = game.challenger.score;
        oScore = game.challengee.score;
        opponent  = authedUsers[game.challengee.socket_id];
    } else {
        pScore = game.challengee.score;
        oScore = game.challenger.score;
        opponent  = authedUsers[game.challenger.socket_id];
    }

    game.cancelled = true;
    game.isFinished = true;
    game.finished = new Date();


    // game > 50% complete?
    // OR - was this player losing?
    var scoreReason = pScore < oScore;
    var timeReason = game.finished - game.started > ((game.duration*1000) * 0.50);

    if (scoreReason || timeReason) {
        console.log(player.username+" has forfeited!");

        // naughty naughty. you won't get away with that!
        botChat(player.username+" forfeited the game against "+opponent.username+"!", 'game-defaulted');

        io.sockets.in('game_'+game._id).emit('game:cancel', {
            "defaulted": true,
            "scoreReason": scoreReason,
            "timeReason": timeReason
        });
        game.defaulted = true;
        game.defaulter = player._id;

        if (player.rank > 0) {
            player.rank--;
        }
        player.defaults = player.defaults != null ? player.defaults : 0;
        player.defaults ++;

        // we can avoid updating the whole opponent by simply doing a mongo $inc,
        // but we still want to increment the rank to keep our authedUsers array up to date
        opponent.rank ++;
        console.log("incrementing "+opponent.username+" rank");

        authedUsers[opponent.sid] = opponent;

        getGamePlayers(game, function(docs) {
            var pIndex = docs[0].username == player.username ? 0 : 1;
            docs[pIndex].rank = player.rank;
            docs[pIndex].defaults = player.defaults;
            db.collection('users', function(err, collection) {
                collection.update({_id: player._id},  docs[pIndex]);
                collection.update({_id: opponent._id}, { $inc : {rank : 1} });
            });
        });
    } else {
        // ok, the scores were even and less than half the game had elapsed. So, fair enough.
        botChat("The game between "+player.username+" and "+opponent.username+" has been cancelled", 'game-cancelled');
        io.sockets.in('game_'+game._id).emit('game:cancel', {
            "defaulted": false
        });
        game.defaulted = false;
    }

    db.collection('games', function(err, collection) {
        collection.update({_id: game._id}, game);
    });

    console.log("cancel game - deleting game ID "+game._id);
    io.sockets.in('lobby').emit('lobby:game:end', game._id);
    delete games[game._id];
}
        
function endGame(game) {
    if (game.isFinished) {
        console.log("not ending game - already finished!");
        return;
    }

    var winner = loser = null;
    var winObject = loseObject = null;

    if (game.challenger.score > game.challengee.score) {
        winner = authedUsers[game.challenger.socket_id];
        loser  = authedUsers[game.challengee.socket_id];
        winObject  = game.challenger;
        loseObject = game.challengee;
    } else {
        winner = authedUsers[game.challengee.socket_id];
        loser  = authedUsers[game.challenger.socket_id];
        winObject  = game.challengee;
        loseObject = game.challenger;
    }

    botChat(winner.username+" beat "+loser.username+" ("+winObject.score+" - "+loseObject.score+")", "game-finished");

    game.winner = winner._id;
    game.isFinished = true;
    game.finished = new Date();

    db.collection('games', function(err, collection) {
        collection.update({_id: game._id}, game);
    });

    winner.rank = winner.rank != null ? winner.rank : 0;
    loser.rank = loser.rank != null ? loser.rank : 0;

    var increase = 0,
        decrease = 0;

    if (winner.rank < loser.rank) {
        // they were better, so i get lots of points
        increase = 3;
        decrease = 2;
    } else if (winner.rank == loser.rank) {
        // even stevens
        increase = 2;
        decrease = 1;
    } else {
        // well, I should have won
        increase = 1;
        decrease = 0;
        // loser rank not affected
    }

    console.log("increase: "+increase+" Vs decrease: "+decrease+" (ranks: "+winner.rank+" beat "+loser.rank+")");

    if (loser.rank - decrease < 0) {
        // ensure we can't be THAT bad - take some edge off the decrease
        // obviously the gap will be negative, so *add* it instead
        decrease += (loser.rank - decrease);
        console.log("capping decrease: "+decrease);
    }
    winner.rank += increase;
    loser.rank  -= decrease;


    // add their kills and deaths
    winner.kills = winner.kills != null ? winner.kills : 0;
    winner.deaths = winner.deaths != null ? winner.deaths : 0;

    loser.kills = loser.kills != null ? loser.kills : 0;
    loser.deaths = loser.deaths != null ? loser.deaths : 0;

    winner.kills += winObject.score;
    winner.deaths += loseObject.score;

    loser.kills += loseObject.score;
    loser.deaths += winObject.score;

    // and finally their, er, wins and losses
    winner.wins = winner.wins != null ? winner.wins+1 : 1;
    loser.losses = loser.losses != null ? loser.losses+1 : 1;

    io.sockets.sockets[winObject.socket_id].emit('game:win', {
        "rank": winner.rank,
        "increase": increase,
        "scores": {
            "win": winObject.score,
            "lose": loseObject.score
        }
    });
    io.sockets.sockets[loseObject.socket_id].emit('game:lose', {
        "rank": loser.rank,
        "decrease": decrease,
        "scores": {
            "win": winObject.score,
            "lose": loseObject.score
        }
    });

    console.log("end game - deleting game ID "+game._id);
    io.sockets.in('lobby').emit('lobby:game:end', game._id);
    delete games[game._id];

    // update our player cache
    authedUsers[winObject.socket_id] = winner;
    authedUsers[loseObject.socket_id] = loser;

    getGamePlayers(game, function(docs) {
        var wIndex = docs[0].username == winner.username ? 0 : 1;
        var lIndex = wIndex == 1 ? 0 : 1;

        docs[wIndex].kills = winner.kills;
        docs[wIndex].deaths = winner.deaths;
        docs[wIndex].wins = winner.wins;
        docs[wIndex].rank = winner.rank;

        docs[lIndex].kills = loser.kills;
        docs[lIndex].deaths = loser.deaths;
        docs[lIndex].losses = loser.losses;
        docs[lIndex].rank = loser.rank;

        db.collection('users', function(err, collection) {
            collection.update({_id: winner._id}, docs[wIndex]);
            collection.update({_id: loser._id}, docs[lIndex]);
        });
    });
}

function rejoinLobby(socket) {
    socket.join('lobby');
    socket.emit('statechange', 'lobby');
    socket.broadcast.to('lobby').emit('lobby:user:join', authedUsers[socket.id]);

    botChat(authedUsers[socket.id].username+" rejoined the lobby");
}

function lobbyChat(author, msg, type) {
    /**
     * @todo - any sweary mary filtering?
     */
    if (type == null) {
        type = 'normal';
    }

    var line = {
        'timestamp': new Date(),
        'author' : author,
        'msg'    : msg,
        'type'   : type
    };

    db.collection('chatlines', function(err, collection) {
        collection.insert(line);
    });

    chatlines.push(line);
    if (chatlines.length > 10) {
        chatlines.splice(0, 1);
    }

    io.sockets.in('lobby').emit('lobby:chat', line);

    // see if socketbot fancies a chat
    var response = SocketBot.respondTo(msg);
    if (response) {
        setTimeout(function() {
            botChat(response.text);
        }, response.delay);
    }
        
}

function botChat(msg, type) {
    if (type == null) {
        type = 'bot';
    }
    lobbyChat(SocketBot.object, msg, type);
}

function findChallenge(who, id, remove) {
    if (remove == null) {
        remove = false;
    }

    for (var i = 0, j = challenges.length; i < j; i++) {
        //if ((who == 'any' && challenges[i]['to'] == id || challenges[i]['from'] == id) ||
        var challenge = null;
        if (who =='any') {
            if (challenges[i].from == id || challenges[i].to == id) {
               challenge = challenges[i]; 
            }
        } else if (challenges[i][who] == id) {
            challenge = challenges[i];
        }
        if (challenge) {
            if (remove) {
                challenges.splice(i, 1);
            }
            return challenge;
        }
    }
    return null;
}

function respawnGamePlayer(game, socket, teleport) {
    if (teleport == null) {
        teleport = false;
    }
    var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee; 
    player.platform = GameManager.getRandomPlatform(player.platform);

    var data = {
        "player": player,
        "teleport": teleport
    };

    trackGameEvent(game, 'player_respawn', data);

    io.sockets.in('game_'+game._id).emit('game:player:respawn', data);
}

function trackGameEvent(game, type, data) {
    //db.collection('games', function(err, collection) {
    console.log("tracking event "+type);
    var event = [{
        'timestamp' : new Date(),
        'type'      : type,
        'data'      : data
    }];
    if (game.events == null) {
        game.events = [];
    }
    game.events.push(event);
        //collection.update({_id: id}, {$push: {"events": event}}, {upsert:true});
    //});
}
