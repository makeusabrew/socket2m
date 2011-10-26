var ChatManager = require('../managers/chat');
var StateManager = require('../managers/state');

// private variables
var io = StateManager.io;

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
            game.started = new Date();

            ChatManager.botChat("Game on! "+game.challenger.username+" Vs "+game.challengee.username, 'game');

            for (var i = 0; i < 2; i++) {
                _sockets[i].emit('game:start', {
                    "user"      : StateManager.authedUsers[_sockets[i].id],
                    "challenger": game.challenger,
                    "challengee": game.challengee,
                    "started"   : game.started,
                    "duration"  : game.duration
                });
            }

            // notify the lobby dwellers
            io.sockets.in('lobby').emit('lobby:game:start', game);
        }
    }
};

module.exports = GameController;
