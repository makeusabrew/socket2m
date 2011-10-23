var http    = require('http'),
    qs      = require('querystring'),
    mongo   = require('mongodb'),
    sio     = require('socket.io'),
    crypto  = require('crypto');

// local modules
var GameManager = require('./app/game_manager.js');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("OK\n");
});

var io = sio.listen(app);
app.listen(7979);

// keep a cached copy of all authed (lobby, in game) users
var authedUsers = {};

// keep a copy of any outstanding challenges between players
var challenges = [];

// keep a copy of all active games in progress
var games = {};

// cache the last 10 or so chat lines
var chatlines = [];

io.configure(function() {
    io.set('transports', ['websocket']);
    io.set('log level', 1); // warn
});

io.configure('development', function() {
    console.log("configuring development options");
    io.set('log level', 2); // info
});

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
        var details = qs.parse(data);
        var match = {
            "username" : details.username,
            "email"    : details.email
        };
        db.collection('users', function(err, collection) {
            collection.findOne(match, function(err, result) {
                if (result == null) {
                    // superb. register
                    var hash = crypto.createHash('sha1');
                    hash.update(details.password);
                    details.password = hash.digest('hex');
                    details.rank = 0;
                    details.kills = 0;
                    details.deaths = 0;
                    collection.insert(details);
                    socket.emit('msg', 'Congratulations, you\'re registered!');
                    socket.emit('statechange', 'login');
                } else {
                    socket.emit('msg', 'Username or Email already in use');
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
            var challenge = findChallenge('to', to);
            if (challenge == null) {
                // excellent! Issue the challenge from the challenger's user object
                challenges.push({
                    "from" : socket.id,
                    "to"   : to 
                });
                _sockets[to].emit('lobby:challenge:receive', authedUsers[socket.id]);
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
                        "duration": 10,
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

                // could do the timeout this way?
                /*
                game.timeHandler = setTimeout(function() {
                    //
                }, game.duration*1000);
                */
            }
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:ready");
        }
    });

    /**
     * game - bullet spawn request (exciting)
     */
    socket.on('game:bullet:spawn', function(options) {
        /**
         * @todo - verify authenticity of the spawn request
         * - can the player fire? (too soon?)
         * - can the player fire from here?
         * - etc
         */
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            // assign a unique ID to the bullet, so we can track it
            options.id = ++game.entityId;
            io.sockets.in('game_'+game._id).emit('game:bullet:spawn', options);
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

                io.sockets.in('game_'+game._id).emit('game:player:kill', {
                    "id": data.id,
                    "scores": [
                        game.challenger.score,
                        game.challengee.score
                    ],
                    "eId": data.eId,
                    "doRespawn": respawn
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
            var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee; 

            player.platform = GameManager.getRandomPlatform(player.platform);
            io.sockets.in('game_'+game._id).emit('game:player:respawn', player);
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
            io.sockets.in('game_'+game._id).emit('game:player:chat', {
                "id" : socket.id,
                "msg": msg
            });
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:player:chat");
        }
    });

    /**
     * game - player thinks time is up
     */
    socket.on('game:timeup', function(msg) {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            if (game.timeup == null) {
                var elapsed = new Date().getTime() - game.started;
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
                    var remaining = game.duration - elapsed;
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
            delete authedUsers[socket.id];
        }

        // was this user in a game? cancel it if so.
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            cancelGame(game);
        }
        io.sockets.emit('user:leave', socket.id);
    });
});

var db = new mongo.Db('socket2m', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {}), {});
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

function cancelGame(game) {
    if (game.isFinished) {
        console.log("not ending game - already finished!");
        return;
    }

    botChat("Game cancelled between "+game.challenger.username+" and "+game.challengee.username, 'game-cancelled');

    io.sockets.in('game_'+game._id).emit('game:cancel');
    game.cancelled = true;
    game.isFinished = true;
    game.finished = new Date();

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

    if (loser.rank - decrease < 0) {
        // ensure we can't be THAT bad - take some edge off the decrease
        decrease -= (loser.rank - decrease);
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

            // update our player cache
            authedUsers[winObject.socket_id] = winner;
            authedUsers[loseObject.socket_id] = loser;
        });
    });
}

function rejoinLobby(socket) {
    socket.join('lobby');
    socket.emit('statechange', 'lobby');
    socket.broadcast.to('lobby').emit('lobby:user:join', authedUsers[socket.id]);

    botChat(authedUsers[socket.id].username+" rejoined the lobby");
}

// socketbot is our friendly chat bot. He mimicks the basic attributes
// of real life players - just enough for the chat room, anyway
var socketbot = {
    "username": "socketbot",
    "email"   : "socketbot@paynedigital.com"
};

function lobbyChat(author, msg, type) {
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
}

function botChat(msg, type) {
    if (type == null) {
        type = 'bot';
    }
    lobbyChat(socketbot, msg, type);
}

function findChallenge(who, id, remove) {
    if (remove == null) {
        remove = false;
    }

    for (var i = 0, j = challenges.length; i < j; i++) {
        if (challenges[i][who] == id) {
            // excellent, this is the challenge we're after
            var challenge = challenges[i];
            if (remove) {
                challenges.splice(i, 1);
            }
            return challenge;
        }
    }
    return null;
}
