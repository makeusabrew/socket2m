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
        started = true;

        players = data.players;
        user = data.user;
        $("#game h2").html("Game On!");

        surface = document.getElementById('viewport').getContext('2d');
        surface.fillRect(16, 668, 16, 32);
        surface.fillRect(908, 668, 16, 32);

        Input.captureKeys([
            'SPACE_BAR'
        ]);
        Input.bindKeys(window);

        // refs #503
        // we need to start a game loop
        // in the game loop, check isKeyDown space bar, then request
        // a bullet:spawn event

    });

    socket.on('bullet:spawn', function(bullet) {
        //
    });

    socket.on('bullet:die', function(bullet) {
        //
    });
})();

socket.emit('game:ready');
