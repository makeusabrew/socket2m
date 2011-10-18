(function() {
    var user = null;
    var players = [];
    var bullets = [];
    var surface = null;
    var started = false;


    socket.on('game:start', function(data) {
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
            'SPACE_BAR'
        ]);
        Input.bindKeys(window);

        // refs #503
        // we need to start a game loop
        // in the game loop, check isKeyDown space bar, then request
        // a bullet:spawn event
        var p1 = Player.factory({
            "id": players[0]._id,
            "x" : 16,
            "y" : 668,
            "a" : 315,
            "v" : 100,
            "c" : "rgb(0, 255, 0)",
            "username" : players[0].username
        });
        var p2 = Player.factory({
            "id": players[1]._id,
            "x" : 908,
            "y" : 668,
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
            GameManager.setPlayer(p2);
            GameManager.setOpponent(p1);
        }

        GameManager.initBuffer("viewport");

        console.log("ready to tick");
        animate();

    });

    socket.on('bullet:spawn', function(bullet) {
        //
    });

    socket.on('bullet:die', function(bullet) {
        //
    });
})();

console.log("ready for game");
socket.emit('game:ready');
