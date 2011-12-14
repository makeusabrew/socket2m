console.log("load state");
var ChatManager = require('../managers/chat');
var io          = require('../managers/socket').getIO();
var db          = require('../db');
var Utils       = require('../shared/utils');

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
var activeBullets = {};

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
        var event = {
            'timestamp' : new Date(),
            'type'      : type,
            'data'      : data
        };
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

        var winner = null,
            loser  = null;

        if (game.challenger.score > game.challengee.score) {
            winner = authedUsers[game.challenger.socket_id];
            loser  = authedUsers[game.challengee.socket_id];
        } else {
            winner = authedUsers[game.challengee.socket_id];
            loser  = authedUsers[game.challenger.socket_id];
        }

        StateManager.terminateGame('end', winner, loser, game);
    },

    // an individual socket will cancel a game
    cancelGame: function(game, authedUser) {
        if (game.isFinished) {
            console.log("not cancelling game - already finished!");
            return;
        }

        var player      = authedUser,
            opponent    = null,
            scoreReason = false;

        // work out which of the *game* players we are
        if (authedUser.sid == game.challenger.socket_id) {
            opponent    = authedUsers[game.challengee.socket_id];
            scoreReason = game.challenger.score < game.challengee.score;
        } else {
            opponent    = authedUsers[game.challenger.socket_id];
            scoreReason = game.challengee.score < game.challenger.score;
        }

        var now = new Date();
        var timeReason = now - game.started > ((game.duration*1000) * 0.50);

        // was this player losing?
        // OR game > 50% complete?
        if (scoreReason || timeReason) {
            StateManager.terminateGame('forfeit', opponent, player, game);
        } else {
            // ok, the scores were even and less than half the game had elapsed. So, fair enough.
            StateManager.terminateGame('cancel', opponent, player, game);
        }
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

    spawnBullet: function(game, bullet) {
        if (activeBullets[game._id] == null) {
            activeBullets[game._id] = [];
        }
        activeBullets[game._id].push(bullet);
    },

    removeBullet: function(game, bullet) {
        for (var i = 0; i < activeBullets[game._id].length; i++) {
            if (activeBullets[game._id][i].id == bullet.id) {
                activeBullets[game._id].splice(i, 1);
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

    findBulletById: function(game, id) {
        if (activeBullets[game._id] == null) {
            return null;
        }

        for (var i = 0; i < activeBullets[game._id].length; i++) {
            if (activeBullets[game._id][i].id == id) {
                return activeBullets[game._id][i];
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

            StateManager.removeUser(socket.id);
        }

        io.sockets.emit('user:leave', socket.id);
    },

    removeUser: function(id) {
        delete authedUsers[id];
    },

    /**
     * @private
     */
    terminateGame: function(reason, winner, loser, game) {
        var gameWinner = null,
            gameLoser  = null;

        // common stuff
        if (winner.sid == game.challenger.socket_id) {
            gameWinner = game.challenger;
            gameLoser  = game.challengee;
        } else {
            gameWinner = game.challengee;
            gameLoser  = game.challenger;
        }

        game.isFinished = true;
        game.finished = new Date();

        winner.kills  = winner.kills  != null ? winner.kills : 0;
        winner.deaths = winner.deaths != null ? winner.deaths : 0;
        winner.shots  = winner.shots  != null ? winner.shots : 0;
        winner.hits   = winner.hits   != null ? winner.hits : 0;

        loser.kills   = loser.kills   != null ? loser.kills : 0;
        loser.deaths  = loser.deaths  != null ? loser.deaths : 0;
        loser.shots   = loser.shots   != null ? loser.shots : 0;
        loser.hits    = loser.hits    != null ? loser.hits : 0;

        winner.shots  += gameWinner.shots;
        winner.hits   += gameWinner.hits;
        winner.kills  += gameWinner.score;
        winner.deaths += gameLoser.score;

        loser.shots  += gameLoser.shots;
        loser.hits   += gameLoser.hits;
        loser.kills  += gameLoser.score;
        loser.deaths += gameWinner.score;

        switch (reason) {
            case 'forfeit':
                console.log(loser.username+" has forfeited!");

                // naughty naughty. you won't get away with that!
                ChatManager.botChat(loser.username+" forfeited the game against "+winner.username+"!", 'game-defaulted');

                io.sockets.in('game_'+game._id).emit('game:cancel', {
                    "defaulted": true
                });
                game.cancelled = true;
                game.defaulted = true;
                game.defaulter = loser._id;

                if (loser.rank > 0) {
                    loser.rank--;
                }

                loser.defaults = loser.defaults != null ? loser.defaults : 0;
                loser.defaults ++;

                // we can avoid updating the whole opponent by simply doing a mongo $inc,
                // but we still want to increment the rank to keep our authedUsers array up to date
                winner.rank ++;

                // reset in-memory winning streaks
                winner.winning_streak = 0;
                loser.winning_streak = 0;

                console.log("incrementing "+winner.username+" rank");
                break;
            case 'cancel':
                // do stuff
                ChatManager.botChat("The game between "+loser.username+" and "+winner.username+" has been cancelled", 'game-cancelled');
                io.sockets.in('game_'+game._id).emit('game:cancel', {
                    "defaulted": false
                });
                game.defaulted = false;
                game.cancelled = true;

                // reset in-memory winning streaks
                winner.winning_streak = 0;
                loser.winning_streak = 0;
                break;
            case 'end':
            default:
                ChatManager.botChat(winner.username+" beat "+loser.username+" ("+gameWinner.score+" - "+gameLoser.score+")", "game-finished");
                game.winner = winner._id;

                winner.rank = winner.rank != null ? winner.rank : 0;
                loser.rank  = loser.rank  != null ? loser.rank : 0;

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

                winner.wins  = winner.wins  != null ? winner.wins+1  : 1;
                loser.losses = loser.losses != null ? loser.losses+1 : 1;
                io.sockets.sockets[winner.sid].emit('game:win', {
                    "rank": winner.rank,
                    "increase": increase,
                    "scores": {
                        "win": gameWinner.score,
                        "lose": gameLoser.score
                    }
                });
                io.sockets.sockets[loser.sid].emit('game:lose', {
                    "rank": loser.rank,
                    "decrease": decrease,
                    "scores": {
                        "win": gameWinner.score,
                        "lose": gameLoser.score
                    }
                });

                // reset in-memory winning streak of loser
                loser.winning_streak = 0;
                // add one on for the winner
                winner.winning_streak ++;

                break;
        }

        // remember, we don't *save* accuracy, but we still want to update the in-memory store of it
        winner.accuracy = Utils.calculateAccuracy(winner);
        loser.accuracy  = Utils.calculateAccuracy(loser);

        // update our player cache
        authedUsers[winner.sid] = winner;
        authedUsers[loser.sid]  = loser;

        // update game stats stuff
        gameLoser.rank.end = loser.rank;
        gameLoser.rank.change = gameLoser.rank.end - gameLoser.rank.start;

        gameWinner.rank.end = winner.rank;
        gameWinner.rank.change = gameWinner.rank.end - gameWinner.rank.start;

        // remove temporary in-memory game data
        delete game.challenger.platform;
        delete game.challenger.x;
        delete game.challenger.a;
        delete game.challenger.v;
        delete game.challenger.firedAt;
        delete game.challenger.weapon;

        delete game.challengee.platform;
        delete game.challengee.x;
        delete game.challengee.a;
        delete game.challengee.v;
        delete game.challengee.firedAt;
        delete game.challengee.weapon;

        delete game.entityId;
        delete game.timeup;

        /**
         * Update Game DB
         */
        db.collection('games', function(err, collection) {
            collection.update({_id: game._id}, game);
        });

        console.log("terminating game - deleting game ID "+game._id);
        io.sockets.in('lobby').emit('lobby:game:end', game._id);

        // remove the game from the in-memory cache
        delete games[game._id];

        /**
         * Update Player DB
         */
        StateManager.getGamePlayers(game, function(docs) {
            var wUpdate = {
                kills  : winner.kills,
                deaths : winner.deaths,
                wins   : winner.wins,
                rank   : winner.rank,
                shots  : winner.shots,
                hits   : winner.hits
            };

            var lUpdate = {
                kills  : loser.kills,
                deaths : loser.deaths,
                losses : loser.losses,
                rank   : loser.rank,
                shots  : loser.shots,
                hits   : loser.hits
            };

            if (reason == 'forfeit') {
                console.log("adding defaults count to update list");
                lUpdate.defaults = loser.defaults;
            }

            // ensure we only update the relevant bits and bobs.
            db.collection('users', function(err, collection) {
                collection.update({_id: winner._id},   {$set: wUpdate});
                collection.update({_id: loser._id}, {$set: lUpdate});
            });
        });
    }
};

module.exports = StateManager;
