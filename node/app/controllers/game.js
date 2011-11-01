var ChatManager = require('app/managers/chat');
var StateManager = require('app/managers/state');

// private variables
var io = require('app/managers/socket').getIO();

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
            options.platform = player.platform;
            options.reloadIn = weapon.reload;

            var bullets = [];
            for (var i = 0; i < weapon.bullets; i++) {
                var fuzz = 0;
                if (weapon.fuzz) {
                    fuzz = (-weapon.fuzz + Math.random()*weapon.fuzz);
                }
                bullets.push({
                    "a" : options.a + fuzz,
                    "v" : options.v + fuzz,
                    "id": ++game.entityId
                });
            }

            options.bullets = bullets;

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
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        if (game.isFinished != null) {
            console.log("ignoring kill for finished game");
            return;
        }

        /**
         * @todo - verify authenticity of the kill request!
         */
        var killer = game.challenger.socket_id == data.id ? game.challengee : game.challenger; 

        killer.score ++;
        killer.hits ++;

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

        StateManager.trackGameEvent(game, 'player_kill', data);

        io.sockets.in('game_'+game._id).emit('game:player:kill', data);
        io.sockets.in('lobby').emit('lobby:game:scorechange', {
            "id": game._id,
            "player": killer.socket_id == game.challenger.socket_id ? "challenger" : "challengee",
            "score": killer.score
        });
        if (game.suddendeath) {
            StateManager.endGame(game);
        }
    },

    respawnPlayer: function(socket) {
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }
        GameController.respawnGamePlayer(game, socket);
    },

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
                "id": ++game.entityId
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
        var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee;

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
            GameController.respawnGamePlayer(game, socket, true);
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
        // @see #639 - lobby join race condition
        // the problem is that in order for another user to receive initial
        // lobby info, they have to have *all* lobby listeners bound
        // so if they emit lobby:ready as we emit lobby:user:join, they might
        // get us in LobbyController.init AND as a result of emit() below
        // hmm
        // as an aside, why can't the actual join, broadcast and chat be done
        // inside LobbyController.init()? more oop, more DRY as we have the
        // same code in the WelcomeController...
        socket.emit('state:change', 'lobby');
    },

    /**
     * private - could declare at top outside the scope of this object?
     */
    respawnGamePlayer: function(game, socket, teleport) {
        if (teleport == null) {
            teleport = false;
        }
        var player = game.challenger.socket_id == socket.id ? game.challenger : game.challengee; 
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
