(function() {
    var user = null;
    var players = [];
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
    });
})();

socket.emit('game:ready');
