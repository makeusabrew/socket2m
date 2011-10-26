var ChatManager = require('../managers/chat');
var StateManager = require('../managers/state');

var io = StateManager.io;

var LobbyController = {
    init: function(socket) {
        var _sockets = io.sockets.clients('lobby');
        var users = [];
        for (var i = 0, j = _sockets.length; i < j; i++) {
            users.push(StateManager.authedUsers[_sockets[i].id]);
        }

        // simply convert the games object to an array
        var activeGames = [];
        for (var i in StateManager.games) {
            if (StateManeger.games[i].started != null) {
                // we only care about games which have been *started*, not necessarily "created"
                activeGames.push(games[i]);
            }
        }

        socket.emit('lobby:users', {
            "timestamp": new Date(),
            "user": StateManager.authedUsers[socket.id],
            "users": users,
            "games": activeGames,
            "chatlines": ChatManager.getChatlines()
        });
    },

    chat: function(socket, msg) {
        ChatManager.lobbyChat(authedUsers[socket.id], msg);
    }
};

module.exports = LobbyController;
