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

            players = data.players;
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
                "id": players[0]._id,
                "x" : 16,
                "y" : 568,
                "a" : 315,
                "v" : 100,
                "c" : "rgb(0, 255, 0)",
                "username" : players[0].username
            });
            var p2 = Player.factory({
                "id": players[1]._id,
                "x" : 908,
                "y" : 568,
                "a" : 225,
                "v" : 100,
                "c" : "rgb(0, 0, 255)",
                "username" : players[1].username
            });

            console.log(p1.getUsername(), p2.getUsername());

            if (players[0]._id == user._id) {
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
        
        'user:leave': function(id) {
            mbalert("The opponent left the game!", function() {
                socket.emit('game:cancel');
            });
        }
    };

})();

socket.emit('game:ready');
