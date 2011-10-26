var qs     = require('querystring'),
    crypto = require('crypto');

var StateManager = require('../managers/state');
var db = require('../db');

// private
var io = StateManager.io;

var WelcomeController = {

    init: function(socket) {
        var uCount = 0, gCount = 0;
        for (var i in StateManager.authedUsers) {
            uCount ++;
        }
        for (var i in StateManager.games) {
            gCount ++;
        }
        socket.emit('welcome:count', {
            'users': uCount,
            'games': gCount
        });
    },

    login: function(socket, data) {
        var details = qs.parse(data);
        db.collection('users', function(err, collection) {

            var hash = crypto.createHash('sha1');
            hash.update(details.password);
            details.password = hash.digest('hex');

            collection.findOne(details, function(err, result) {
                if (result == null) {
                    socket.emit('msg', 'Sorry, these details don\'t appear to be valid. Please try again.');
                } else {
                    duplicateLogin = false;
                    for (var i in StateManager.authedUsers) {
                        if (StateManager.authedUsers[i].username == result.username) {
                            duplicateLogin = true;
                            break;
                        }
                    }
                    if (duplicateLogin) {
                        socket.emit('msg', 'Sorry, this user already appears to be logged in. Please try again.');
                    } else {
                        collection.update({_id: result._id}, {$set: {lastLogin: new Date()}});
                        result.sid = socket.id;
                        delete result.password;
                        StateManager.authedUsers[socket.id] = result;
                        socket.join('lobby');
                        socket.emit('statechange', 'lobby');
                        socket.broadcast.to('lobby').emit('lobby:user:join', result);
                        ChatManager.botChat(StateManager.authedUsers[socket.id].username+" joined the lobby");
                    }
                }
            });
        });
    },

    goRegister: function(socket) {
        socket.emit('statechange', 'register');
    }
};

module.exports = WelcomeController;
