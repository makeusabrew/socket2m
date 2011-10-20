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
            $("#game h2").html("Game On!");

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
                "y" : ((challenger.platform+1)*200)-32,
                "a" : challenger.a,
                "v" : challenger.v,
                "c" : "rgb(0, 255, 0)",
                "username" : challenger.username
            });
            var p2 = Player.factory({
                "id": challengee.socket_id,
                "x" : challengee.x,
                "y" : ((challengee.platform+1)*200)-32,
                "a" : challengee.a,
                "v" : challengee.v,
                "c" : "rgb(0, 0, 255)",
                "username" : challengee.username
            });

            console.log(p1.getUsername()+ " Vs "+p2.getUsername());

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

            // preload some sfx
            SoundManager.preloadSound("/sounds/bang_3.wav", "weapon:fire");

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
        
        'user:leave': function(id) {
            mbalert("The opponent left the game!", function() {
                socket.emit('game:cancel');
            });
        }
    };

})();

socket.emit('game:ready');
