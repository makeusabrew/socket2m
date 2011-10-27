console.log("load state");
var ChatManager = require('app/managers/chat');
var io          = require('app/managers/socket').getIO();

/**
 * private
 */

// keep a copy of any outstanding challenges between players
var challenges = [];

// keep a copy of all active games in progress
var games = {};

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

// keep a cached copy of all authed (lobby, in game) users
var authedUsers = {};

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

var StateManager = {
    
    findChallenge: function(who, id, remove) {
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
    },

    addChallenge: function(data) {
        challenges.push(data);
    },

    addGame: function(game) {
        // @todo can we switch to an array here instead?
        games[game._id] = game;
    },

    findGameForSocketId: function(sid) {
        for (var i in games) {
            if (games[i].challenger.socket_id == sid ||
                games[i].challengee.socket_id == sid) {
                return games[i];
            }
        }
        return null;
    },

    getRandomPlatform: function(current) {
        var _platforms = 3;
        if (current == null) {
            current = -1;
        }
        var platform;
        do {
            platform = Math.floor(Math.random()*_platforms);
        } while (platform == current);
        return platform;
    },

    getWeapon: function(type) {
        return weapons[type];
    },

    trackGameEvent: function(game, type, data) {
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
    },

    endGame: function(game) {
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

        ChatManager.botChat(winner.username+" beat "+loser.username+" ("+winObject.score+" - "+loseObject.score+")", "game-finished");

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
        winner.shots = winner.shots != null ? winner.shots : 0;
        winner.hits = winner.hits != null ? winner.hits : 0;

        loser.kills = loser.kills != null ? loser.kills : 0;
        loser.deaths = loser.deaths != null ? loser.deaths : 0;
        loser.shots = loser.shots != null ? loser.shots : 0;
        loser.hits = loser.hits != null ? loser.hits : 0;

        winner.kills += winObject.score;
        winner.deaths += loseObject.score;

        loser.kills += loseObject.score;
        loser.deaths += winObject.score;

        winner.shots += winObject.shots;
        winner.hits += winObject.hits;

        loser.shots += loseObject.shots;
        loser.hits += loseObject.hits;

        // and finally their, er, wins and losses
        winner.wins = winner.wins != null ? winner.wins+1 : 1;
        loser.losses = loser.losses != null ? loser.losses+1 : 1;

        StateManager.io.sockets.sockets[winObject.socket_id].emit('game:win', {
            "rank": winner.rank,
            "increase": increase,
            "scores": {
                "win": winObject.score,
                "lose": loseObject.score
            }
        });
        StateManager.io.sockets.sockets[loseObject.socket_id].emit('game:lose', {
            "rank": loser.rank,
            "decrease": decrease,
            "scores": {
                "win": winObject.score,
                "lose": loseObject.score
            }
        });

        console.log("end game - deleting game ID "+game._id);
        StateManager.io.sockets.in('lobby').emit('lobby:game:end', game._id);

        delete games[game._id];

        // update our player cache
        authedUsers[winObject.socket_id] = winner;
        authedUsers[loseObject.socket_id] = loser;

        StateManager.getGamePlayers(game, function(docs) {
            var wUpdate = {
                kills: winner.kills,
                deaths: winner.deaths,
                wins: winner.wins,
                rank: winner.rank,
                shots: winner.shots,
                hits: winner.hits
            };

            var lUpdate = {
                kills: loser.kills,
                deaths: loser.deaths,
                losses: loser.losses,
                rank: loser.rank,
                shots: loser.shots,
                hits: loser.hits
            };

            db.collection('users', function(err, collection) {
                collection.update({_id: winner._id},   {$set: wUpdate});
                collection.update({_id: loser._id}, {$set: lUpdate});
            });
        });
    },

    // an individual socket will cancel a game
    cancelGame: function(game, authedUser) {
        if (game.isFinished) {
            console.log("not cancelling game - already finished!");
            return;
        }

        var player, opponent;
        var playerObject, opponentObject;

        player = authedUser;

        if (authedUser.sid == game.challenger.socket_id) {
            playerObject = game.challenger;
            opponentObject = game.challengee;
            opponent  = authedUsers[game.challengee.socket_id];
        } else {
            playerObject = game.challengee;
            opponentObject = game.challenger;
            opponent  = authedUsers[game.challenger.socket_id];
        }

        game.cancelled = true;
        game.isFinished = true;
        game.finished = new Date();

        player.kills = player.kills != null ? player.kills : 0;
        player.deaths = player.deaths != null ? player.deaths : 0;
        player.shots = player.shots != null ? player.shots : 0;
        player.hits = player.hits != null ? player.hits : 0;

        opponent.kills = opponent.kills != null ? opponent.kills : 0;
        opponent.deaths = opponent.deaths != null ? opponent.deaths : 0;
        opponent.shots = opponent.shots != null ? opponent.shots : 0;
        opponent.hits = opponent.hits != null ? opponent.hits : 0;

        player.kills += playerObject.score;
        player.deaths += opponentObject.score;

        opponent.kills += opponentObject.score;
        opponent.deaths += playerObject.score;

        player.shots += playerObject.shots;
        player.hits += playerObject.hits;

        opponent.shots += opponentObject.shots;
        opponent.hits += opponentObject.hits;


        // game > 50% complete?
        // OR - was this player losing?
        var scoreReason = playerObject.score < opponentObject.score;
        var timeReason = game.finished - game.started > ((game.duration*1000) * 0.50);

        if (scoreReason || timeReason) {
            console.log(player.username+" has forfeited!");

            // naughty naughty. you won't get away with that!
            ChatManager.botChat(player.username+" forfeited the game against "+opponent.username+"!", 'game-defaulted');

            StateManager.io.sockets.in('game_'+game._id).emit('game:cancel', {
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

        } else {
            // ok, the scores were even and less than half the game had elapsed. So, fair enough.
            ChatManager.botChat("The game between "+player.username+" and "+opponent.username+" has been cancelled", 'game-cancelled');
            StateManager.io.sockets.in('game_'+game._id).emit('game:cancel', {
                "defaulted": false
            });
            game.defaulted = false;
        }

        StateManager.getGamePlayers(game, function(docs) {
            var pUpdate = {
                kills: player.kills,
                deaths: player.deaths,
                rank: player.rank,
                shots: player.shots,
                hits: player.hits
            };

            var oUpdate = {
                kills: opponent.kills,
                deaths: opponent.deaths,
                rank: opponent.rank,
                shots: opponent.shots,
                hits: opponent.hits
            };

            db.collection('users', function(err, collection) {
                collection.update({_id: player._id},   {$set: pUpdate});
                collection.update({_id: opponent._id}, {$set: oUpdate});
            });
        });

        db.collection('games', function(err, collection) {
            collection.update({_id: game._id}, game);
        });

        console.log("cancel game - deleting game ID "+game._id);
        StateManager.io.sockets.in('lobby').emit('lobby:game:end', game._id);
        delete games[game._id];
    },

    // retrieve actual player objects from collection
    getGamePlayers: function(game, cb) {
        var players = null;
        db.collection('users', function(err, collection) {
            collection.find({ $or : [{"_id": game.challenger.db_id}, {"_id": game.challengee.db_id}]}, function(err, cursor) {
                cursor.toArray(function(err, docs) {
                    cb(docs);
                });
            });
        });
    },

    getUserForSocket: function(id) {
        return authedUsers[id];
    },

    countUsers: function() {
        var uCount = 0;
        for (var i in authedUsers) {
            uCount ++;
        }
        return uCount;
    },

    countGames: function() {
        var gCount = 0;
        for (var i in games) {
            gCount ++;
        }
        return gCount;
    },

    getGames: function() {
        return games;
    },

    isUserLoggedIn: function(username) {
        for (var i in authedUsers) {
            if (authedUsers[i].username == username) {
                return true;
            }
        }
        return false;
    },

    addUser: function(user) {
        authedUsers[user.sid] = user;
    },

    countGamePowerups: function(game) {
        if (activePowerups[game._id] == null) {
            return 0;
        }
        return activePowerups[game._id].length;
    },

    getGamePowerups: function(game) {
        if (activePowerups[game._id] == null) {
            return [];
        }
        return activePowerups[game._id];
    },

    spawnPowerup: function(game, powerup) {
        if (activePowerups[game._id] == null) {
            activePowerups[game._id] = [];
        }
        activePowerups[game._id].push(powerup);
    },

    removePowerup: function(game, powerup) {
        for (var i = 0; i < activePowerups[game._id].length; i++) {
            if (activePowerups[game._id][i].id == powerup.id) {
                activePowerups[game._id].splice(i, 1);
                return;
            }
        }
    },

    getPowerupForType: function(type) {
        return powerups[type];
    },

    findPowerupById: function(game, id) {
        for (var i = 0; i < activePowerups[game._id].length; i++) {
            if (activePowerups[game._id][i].id == id) {
                return activePowerups[game._id][i];
            }
        }
        return null;
    },

    /**
     * @todo this isn't necessarily right, I just couldn't find a decent controller for it...
     */
    handleDisconnect: function(socket) {
        // get rid of this user from the active user array
        if (authedUsers[socket.id] != null) {
            ChatManager.botChat(authedUsers[socket.id].username+" left");

            // did the user have any outstanding challenges?
            StateManager.findChallenge('any', socket.id, true);

            // was this user in a game? cancel it if so.
            var game = StateManager.findGameForSocketId(socket.id);
            if (game != null) {
                StateManager.cancelGame(game, authedUsers[socket.id]);
            }

            delete authedUsers[socket.id];
        }

        StateManager.io.sockets.emit('user:leave', socket.id);
    }
};

module.exports = StateManager;
