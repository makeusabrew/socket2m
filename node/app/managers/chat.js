console.log("load chat");
var db        = require('../db');
var SocketBot = require('../socket_bot');
var io        = require('../managers/socket').getIO();

// cache the last 10 or so chat lines
var chatlines = [];

var ChatManager = {
    lobbyChat: function(author, msg, type, extra) {
        /**
         * @todo - any sweary mary filtering?
         */
        if (type == null) {
            type = 'normal';
        }

        msg = msg.replace(/(<([^>]+)>)/ig,"");

        var line = {
            'timestamp': new Date(),
            'author' : author,
            'msg'    : msg,
            'type'   : type,
            'extra'  : extra
        };

        db.collection('chatlines', function(err, collection) {
            collection.insert(line);
        });
        var simpleline = {
            "timestamp": line.timestamp,
            "author": line.author.username,
            "msg": line.msg,
            "type": line.type,
            "extra": line.extra
        };
        chatlines.push(simpleline);
        if (chatlines.length > 10) {
            chatlines.splice(0, 1);
        }

        io.sockets.in('lobby').emit('lobby:chat', simpleline);

        // see if socketbot fancies a chat
        SocketBot.respondTo(msg, function(response) {
            if (response != null) {
                setTimeout(function() {
                    ChatManager.botChat(response.text);
                }, response.delay);
            }
        });
    },

    botChat: function(msg, type, extra) {
        if (type == null) {
            type = 'bot';
        }
        ChatManager.lobbyChat(SocketBot.object, msg, type, extra);
    },

    getChatlines: function() {
        return chatlines;
    }
};

module.exports = ChatManager;
