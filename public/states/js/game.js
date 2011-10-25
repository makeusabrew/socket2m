(function() {
    var user = null;

    stateListeners = {
        'game:start': function(data) {
            console.log("starting game");
            console.log(data);
            started = true;

            challenger = data.challenger;
            challengee = data.challengee;
            user = data.user;
            $("#state-title").html("Game On: "+challenger.username+" Vs "+challengee.username);
            $("#game .stats").html("0");

            GameManager.bindKeys();


            var p1 = Player.factory({
                "id": challenger.socket_id,
                "x" : challenger.x,
                "y" : GameManager.getCoordinateForPlatform(challenger.platform),
                "a" : challenger.a,
                "v" : challenger.v,
                "c" : "rgb(0, 255, 0)",
                "side": "left",
                "username" : challenger.username
            });
            var p2 = Player.factory({
                "id": challengee.socket_id,
                "x" : challengee.x,
                "y" : GameManager.getCoordinateForPlatform(challengee.platform),
                "a" : challengee.a,
                "v" : challengee.v,
                "c" : "rgb(0, 0, 255)",
                "side": "right",
                "username" : challengee.username
            });

            if (challenger.socket_id == user.sid) {
                // we're "player 1" - face right
                GameManager.setPlayer(p1);
                GameManager.setOpponent(p2);
            } else {
                // we're p2 so... well, you get it
                GameManager.setPlayer(p2);
                GameManager.setOpponent(p1);
            }

            // bind any canvas rendering to #viewport
            GameManager.initSurface("viewport");

            GameManager.addPlatforms();

            $("#game #volume").click(function(e) {
                e.preventDefault();
                SoundManager.toggleSounds();
            });

            GameManager.start(data.duration);

            // GO!
            console.log("starting tick()");
            tick();

        },

        'game:weapon:fire': function(options) {
            GameManager.actuallyFireWeapon(options);
        },

        'game:weapon:fire:wait': function(msec) {
            GameManager.reloadPlayerWeaponIn(msec);
        },

        'game:powerup:spawn': function(options) {
            GameManager.actuallySpawnPowerup(options);
        },

        'game:powerup:claim': function(options) {
            GameManager.actuallyClaimPowerup(options);
        },

        'game:weapon:change': function(type) {
            console.log("got weapon change", type);
            GameManager.changePlayerWeapon(type);
        },

        'game:bullet:die': function(options) {
            //
        },

        'game:player:kill': function(options) {
            GameManager.actuallyKillPlayer(options);
        },

        'game:player:respawn': function(options) {
            GameManager.actuallyRespawnPlayer(options);
        },

        'game:player:chat': function(msg) {
            GameManager.showChatMessage(msg);
        },

        'game:win': function(stats) {
            GameManager.handleWin(stats);
        },

        'game:lose': function(stats) {
            GameManager.handleLose(stats);
        },
        
        'game:cancel': function(options) {
            GameManager.cancelGame(options);
        },

        'game:suddendeath': function() {
            GameManager.setSuddenDeath();
        }
    };

})();

// preload some sfx
SoundManager.preloadSound("/sounds/bang.wav", "weapon:fire");
SoundManager.preloadSound("/sounds/applause.wav", "player:kill");
SoundManager.preloadSound("/sounds/boo.wav", "player:die");
SoundManager.preloadSound("/sounds/chat.wav", "chat");
SoundManager.preloadSound("/sounds/sudden_death.wav", "game:suddendeath");
SoundManager.preloadSound("/sounds/win.wav", "game:win");
SoundManager.preloadSound("/sounds/lose.wav", "game:lose");
SoundManager.preloadSound("/sounds/teleport.wav", "player:teleport");
SoundManager.preloadSound("/sounds/weapon.wav", "weapon:change");
SoundManager.preloadSound("/sounds/powerup.wav", "game:powerup:spawn");

socket.emit('game:ready');
