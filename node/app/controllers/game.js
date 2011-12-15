var ChatManager  = require('../managers/chat');
var StateManager = require('../managers/state');

// private variables
var io = require('../managers/socket').getIO();

var GameController = {
    init: function(socket) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        console.log("Socket ID "+socket.id+" ready to play game ID "+game._id);
        socket.join("game_"+game._id);

        var _sockets = io.sockets.clients('game_'+game._id);
        console.log("players present: "+_sockets.length);
        if (_sockets.length == 2) {
            game.playersPrepared = 0;

            for (var i = 0; i < 2; i++) {
                _sockets[i].emit('game:prepare', {
                    "user"      : StateManager.getUserForSocket(_sockets[i].id),
                    "challenger": game.challenger,
                    "challengee": game.challengee,
                    "started"   : game.started,
                    "duration"  : game.duration
                });
            }
        }
    },

    start: function(socket) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        game.playersPrepared ++;
        if (game.playersPrepared == 2) {
            delete game.playersPrepared;

            game.started = new Date();

            console.log("both players prepared - let's go!");
            ChatManager.botChat("Game on! "+game.challenger.username+" Vs "+game.challengee.username, 'game');
            io.sockets.in('game_'+game._id).emit('game:start');
            // notify the lobby dwellers
            io.sockets.in('lobby').emit('lobby:game:start', game);
        }
    },

    entitiesTouching: function(e1, e2) {
        return GameController.horizontalIntersect(e1, e2) &&
               GameController.verticalIntersect(e1, e2);
    },

    horizontalIntersect: function(e1, e2) {
        return (e1.left <= e2.right && e2.left <= e1.right);
    },

    verticalIntersect: function(e1, e2) {
        return (e1.top <= e2.bottom && e2.top  <= e1.bottom);
    },

    getCoordinateForPlatform: function(platform) {
        return ((platform+1)*200)-32;
    },

    fireWeapon: function(socket, options) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }

        var player = socket.id == game.challenger.socket_id ? game.challenger : game.challengee;
        var now = new Date().getTime();

        // when did they last fire?
        player.firedAt = player.firedAt ? player.firedAt : 0;
        player.weapon = player.weapon ? player.weapon : 0;

        var weapon = StateManager.getWeapon(player.weapon);

        if (now >= player.firedAt + weapon.reload) {
            // ok, go for it - but add a few options
            player.firedAt = now;

            player.shots ++;

            options.x = player.x;
            options.o = socket.id;
            options.t = now;
            options.platform = player.platform;
            options.reloadIn = weapon.reload;

            var bullets = [];
            for (var i = 0; i < weapon.bullets; i++) {
                var fuzz = 0;
                if (weapon.fuzz) {
                    fuzz = (-weapon.fuzz + Math.random()*weapon.fuzz);
                }
                var a = options.a + fuzz;
                var v = options.v + fuzz;
                var b = {
                    "id": ++game.entityId,
                    "vx": Math.round(Math.cos((a/180)*Math.PI) * v),
                    "vy": Math.round(Math.sin((a/180)*Math.PI) * v)
                };
                bullets.push(b);

                var bClone = {};
                for (var j in b) {
                    bClone[j] = b[j];
                }
                bClone.t = options.t;
                bClone.o = socket.id;
                bClone.x = player.x;
                // @todo platform -> coordinate calc should be isomorphic, this is lifted from game_manager.js!
                bClone.y = GameController.getCoordinateForPlatform(player.platform);
                StateManager.spawnBullet(game, bClone);
            }

            options.bullets = bullets;

            delete options.a;
            delete options.v;

            StateManager.trackGameEvent(game, 'weapon_fire', options);

            io.sockets.in('game_'+game._id).emit('game:weapon:fire', options);
        } else {
            var reload = (player.firedAt + weapon.reload - now);
            console.log("socket "+socket.id+" trying to fire too early: wait "+reload+" ms");
            socket.emit('game:weapon:fire:wait', reload);
        }
    },

    killPlayer: function(socket, data) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in killPlayer");
            return;
        }
        if (game.isFinished != null) {
            console.log("ignoring kill for finished game");
            return;
        }

        // first off - is this bullet legit for this game?
        var bullet = StateManager.findBulletById(game, data.eId);
        if (bullet == null || bullet.o != socket.id) {
            console.log("Invalid bullet!");
            return;
        }

        // these here equations work in seconds
        var t = (new Date().getTime() - bullet.t) / 1000;
        var clientTime = data.t;
        var variance = Math.abs(clientTime - t);
        if (variance <= 0.3) {
            // client within 300ms
            console.log("Client timestamp acceptable, using instead of server time");
            console.log(clientTime+ " VS "+t+ " - "+variance);
            t = clientTime;
        }

        var x = (bullet.vx * t) + bullet.x;
        var y = (bullet.vy * t + 0.5 * 20.0 * (t*t)) + bullet.y;

        var killer   = game.challenger.socket_id == socket.id ? game.challenger : game.challengee; 
        var opponent = game.challenger.socket_id == socket.id ? game.challengee : game.challenger;

        var bRect = {
            "left": x,
            "right": x + 3,  // @todo config / isomorphic
            "top": y,
            "bottom": y + 3  // @todo as above
        };
        var pRect = {
            "left": opponent.x,
            "right": opponent.x + 16, // @todo as above
            "top": GameController.getCoordinateForPlatform(opponent.platform),
            "bottom": GameController.getCoordinateForPlatform(opponent.platform) + 32
        };

        if (!GameController.entitiesTouching(bRect, pRect)) {
            console.log("NO HIT");
            return;

            /*
            console.log(bRect);
            console.log(pRect);

            console.log("Bullet time server:" +t);
            console.log("bullet?");
            console.log(data.bullet);
            */

            /*
            var dx = 0,
                dy = 0;

            if (!GameController.horizontalIntersect(bRect, pRect)) {
                dx = Math.min(
                    Math.abs(bRect.left - pRect.left),
                    Math.abs(bRect.left - pRect.right),
                    Math.abs(bRect.right - pRect.left),
                    Math.abs(bRect.right - pRect.right)
                );
            }

            if (!GameController.verticalIntersect(bRect, pRect)) {
                dy = Math.min(
                    Math.abs(bRect.top - pRect.top),
                    Math.abs(bRect.top - pRect.bottom),
                    Math.abs(bRect.bottom - pRect.top),
                    Math.abs(bRect.bottom - pRect.bottom)
                );
            }

            if (dx > 1 || dy > 1) {
                console.log("difference too large, marking no hit");
                return;
            }
            console.log("difference < 1, allowing hit");
            */
        }

        killer.score ++;
        killer.hits ++;

        var respawn = game.suddendeath ? false : true;

        var data = {
            "kId": socket.id,
            "scores": [
                game.challenger.score,
                game.challengee.score
            ],
            "eId": data.eId,
            "doRespawn": respawn
        };

        StateManager.trackGameEvent(game, 'player_kill', data);

        StateManager.removeBullet(game, bullet);

        io.sockets.in('game_'+game._id).emit('game:player:kill', data);
        io.sockets.in('lobby').emit('lobby:game:scorechange', {
            "id": game._id,
            "player": killer.socket_id == game.challenger.socket_id ? "challenger" : "challengee",
            "score": killer.score
        });
        if (game.suddendeath) {
            StateManager.endGame(game);
        } else {
            GameController.respawnGamePlayer(game, opponent.socket_id);
        }
    },

    /*
    respawnPlayer: function(socket) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        GameController.respawnGamePlayer(game, socket);
    },
    */

    chat: function(socket, msg) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        var data = {
            "id" : socket.id,
            "msg": msg
        };
        StateManager.trackGameEvent(game, 'player_chat', data);
        io.sockets.in('game_'+game._id).emit('game:player:chat', data);
    },

    spawnPowerup: function(socket) {
        // let's spawn a random powerup

        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }

        if (StateManager.countGamePowerups(game) < 3) {
            // @todo FIXME replace hard coded stuff
            // how are we going to get round the fact that the server doesn't know the dimensions of the canvas?
            // easiest I suppose is to deal with a more abstract unit, e.g. metres or percentages...
            var x = Math.floor(Math.random()*801) + 75;
            var y = Math.floor(Math.random()*521) + 20;
            // @see #575
            //var t = Math.floor(Math.random()*3);
            var t = 0;
            var r = 10;
            var powerup = {
                "x": x,
                "y": y,
                "type": t,
                "letter": StateManager.getPowerupForType(t).letter,
                "r": r,
                "id": ++game.entityId,
                "t": new Date().getTime()
            };
            StateManager.spawnPowerup(game, powerup);
            StateManager.trackGameEvent(game, 'powerup_spawn', powerup);

            io.sockets.in('game_'+game._id).emit('game:powerup:spawn', powerup);
        } else {
            console.log("not spawning powerup - too many active");
        }
    },

    claimPowerup: function(socket, options) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        var powerup = StateManager.findPowerupById(game, options.id);
        if (powerup == null) {
            console.log("could not find game powerup "+options.id);
            return;
        }

        // first off - is this bullet legit for this game?
        var bullet = StateManager.findBulletById(game, options.eId);
        if (bullet == null || bullet.o != socket.id) {
            console.log("Invalid bullet!");
            return;
        }
        var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee;

        // these here equations work in seconds
        var t = (new Date().getTime() - bullet.t) / 1000;
        var clientTime = options.t;
        var variance = Math.abs(clientTime - t);
        if (variance <= 0.3) {
            // client within 300ms
            console.log("Client timestamp acceptable, using instead of server time");
            console.log(clientTime+ " VS "+t+ " - "+variance);
            t = clientTime;
        }

        var x = (bullet.vx * t) + bullet.x;
        var y = (bullet.vy * t + 0.5 * 20.0 * (t*t)) + bullet.y;

        var bRect = {
            "left": x,
            "right": x + 3,  // @todo config / isomorphic
            "top": y,
            "bottom": y + 3  // @todo as above
        };
        var pRect = {
            "left": powerup.x,
            "right": powerup.x + (powerup.r*2),
            "top": powerup.y,
            "bottom": powerup.y + (powerup.r*2)
        };

        if (!GameController.entitiesTouching(bRect, pRect)) {
            console.log("NO HIT");
        }

        player.hits ++;

        var data = {
            "id": powerup.id,
            "eId": options.eId,
        }
        StateManager.trackGameEvent(game, 'powerup_claim', data);
        io.sockets.in('game_'+game._id).emit('game:powerup:claim', data);

        // got it!
        // what does it do?
        // @todo this probably sits elsewhere...
        console.log("player claiming powerup type "+powerup.type);
        if (powerup.type == 0) {
            // teleport
            GameController.respawnGamePlayer(game, socket.id, true);
        } else if (powerup.type == 1) {
            // shotgun
            player.weapon = 1;
            socket.emit("game:weapon:change", 1);
        } else if (powerup.type == 2) {
            // pistol
            player.weapon = 0;
            socket.emit("game:weapon:change", 0);
        }

        StateManager.removePowerup(game, powerup);
    },

    timeup: function(socket) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        if (game.isFinished) {
            console.log("ignoring timeup for finished game");
            return;
        }
        if (game.timeup != null) {
            console.log("ignoring duplicate game:timeup message");
            return;
        }
        var elapsed = (new Date().getTime() - game.started) / 1000;
        if (elapsed >= game.duration) {
            console.log("game time is UP! Elapsed: "+elapsed+" Vs Duration: "+game.duration);
            game.timeup = true;
            if (game.challenger.score != game.challengee.score) {
                // excellent, we have a winner
                StateManager.endGame(game);
            } else {
                // draw - sudden death
                game.suddendeath = true;
                console.log("scores are tied - sudden death mode");
                io.sockets.in('game_'+game._id).emit('game:suddendeath');
            }
        } else {
            console.log("client reported incorrect game timeup "+elapsed+" Vs "+game.duration);

            // let the client know, in millis, when to ask for the game end again.
            var remaining = Math.ceil((game.duration - elapsed)*1000);
            socket.emit('game:timeup:rejected', remaining);
        }
    },

    rejoinLobby: function(socket) {
        socket.emit('state:change', 'lobby');
    },

    /**
     * private - could declare at top outside the scope of this object?
     */
    respawnGamePlayer: function(game, socket_id, teleport) {
        if (teleport == null) {
            teleport = false;
        }
        var player = game.challenger.socket_id == socket_id ? game.challenger : game.challengee; 
        player.platform = StateManager.getRandomPlatform(player.platform);

        var data = {
            "player": player,
            "teleport": teleport
        };

        StateManager.trackGameEvent(game, 'player_respawn', data);

        io.sockets.in('game_'+game._id).emit('game:player:respawn', data);
    }
};

module.exports = GameController;
