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
        GameManager.setPlayer(
            Player.factory({
                "id": 1,
                "x" : 16,
                "y" : 668,
                "a" : 315,
                "v" : 10,
                "c" : "rgb(0, 255, 0)",
                "username" : "foo"
            })
        );

        GameManager.setOpponent(
            Player.factory({
                "id": 2,
                "x" : 908,
                "y" : 668,
                "a" : 225,
                "v" : 10,
                "c" : "rgb(0, 0, 255)",
                "username" : "bar"
            })
        );

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
