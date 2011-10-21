(function() {
    var user = null;
    var players = [];
    var bullets = [];
    var surface = null;
    var started = false;

    stateListeners = {
        'game:start': function(data) {
            // the below is temporary - we get a race condition if both sockets start at almost the same time
            // so we have to defend against a double init
            if (started) {
                return;
            }
            console.log("starting game");
            console.log(data);
            started = true;

            challenger = data.challenger;
            challengee = data.challengee;
            user = data.user;
            $("#game h2").html("Game On: "+challenger.username+" Vs "+challengee.username);
            $("#game .stats").html("0");

            Input.captureKeys([
                'SPACE_BAR',
                'UP_ARROW',
                'DOWN_ARROW',
                'LEFT_ARROW',
                'RIGHT_ARROW'
            ]);
            Input.bindKeys(window);

            var p1 = Player.factory({
                "id": challenger.socket_id,
                "x" : challenger.x,
                "y" : GameManager.getCoordinateForPlatform(challenger.platform),
                "a" : challenger.a,
                "v" : challenger.v,
                "c" : "rgb(0, 255, 0)",
                "username" : challenger.username
            });
            var p2 = Player.factory({
                "id": challengee.socket_id,
                "x" : challengee.x,
                "y" : GameManager.getCoordinateForPlatform(challengee.platform),
                "a" : challengee.a,
                "v" : challengee.v,
                "c" : "rgb(0, 0, 255)",
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


            console.log("ready to tick");
            animate();

        },

        'game:bullet:spawn': function(options) {
            GameManager.actuallySpawnBullet(options);
        },

        'game:bullet:die': function(options) {
            //
        },

        'game:player:kill': function(id) {
            GameManager.actuallyKillPlayer(id);
        },

        'game:player:respawn': function(player) {
            GameManager.actuallyRespawnPlayer(player);
        },
        
        'user:leave': function(id) {
            mbalert("The opponent left the game!", function() {
                socket.emit('game:cancel');
            });
        }
    };

})();

// preload some sfx
SoundManager.preloadSound("/sounds/bang.wav", "weapon:fire");
SoundManager.preloadSound("/sounds/applause.wav", "player:kill");
SoundManager.preloadSound("/sounds/boo.wav", "player:die");

socket.emit('game:ready');
