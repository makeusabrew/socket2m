console.log("load chat");
var db = require('../db');
var SocketBot = require('../socket_bot');
var StateManager = require('../managers/state');

// cache the last 10 or so chat lines
var chatlines = [];

var ChatManager = {
    lobbyChat: function(author, msg, type) {
        /**
         * @todo - any sweary mary filtering?
         */
        if (type == null) {
            type = 'normal';
        }

        var line = {
            'timestamp': new Date(),
            'author' : author,
            'msg'    : msg,
            'type'   : type
        };

        db.collection('chatlines', function(err, collection) {
            collection.insert(line);
        });

        chatlines.push(line);
        if (chatlines.length > 10) {
            chatlines.splice(0, 1);
        }

        // @todo we can't emit here because IO is undefined...
        // simply because State includes Chat, and we can't assign StateManager.io
        // until after we've required state.... hum
        // FIXME is to surely break the dependency on StateManager simply for IO object...
        io.sockets.in('lobby').emit('lobby:chat', line);

        // see if socketbot fancies a chat
        var response = SocketBot.respondTo(msg);
        if (response) {
            setTimeout(function() {
                ChatManager.botChat(response.text);
            }, response.delay);
        }
    },

    botChat: function(msg, type) {
        if (type == null) {
            type = 'bot';
        }
        ChatManager.lobbyChat(SocketBot.object, msg, type);
    },

    getChatlines: function() {
        return chatlines;
    }
};

module.exports = ChatManager;
