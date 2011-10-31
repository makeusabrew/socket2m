var qs     = require('querystring'),
    crypto = require('crypto');

var StateManager = require('app/managers/state');
var ChatManager  = require('app/managers/chat');
var db = require('app/db');

// private
var io = require('app/managers/socket').getIO();

var WelcomeController = {

    init: function(socket) {
        socket.emit('welcome:count', {
            'users': StateManager.countUsers(),
            'games': StateManager.countGames()
        });
    },

    login: function(socket, data) {
        try {
            var details = qs.parse(data);
        } catch (e) {
            // well, if we had a parse error or whatever, the deets were invalid
            socket.emit('msg', 'Sorry, these details don\'t appear to be valid. Please try again.');
            return;
        }

        if (!details.username ||
            !details.password) {
            socket.emit('msg', 'Sorry, these details don\'t appear to be valid. Please try again.');
            return;
        }

        db.collection('users', function(err, collection) {
            
            var hash = crypto.createHash('sha1');
            hash.update(details.password);
            details.password = hash.digest('hex');

            collection.findOne(details, function(err, result) {
                if (result == null) {
                    socket.emit('msg', 'Sorry, these details don\'t appear to be valid. Please try again.');
                } else {
                    if (StateManager.isUserLoggedIn(result.username)) {
                        socket.emit('msg', 'Sorry, this user already appears to be logged in. Please try again.');
                    } else {
                        result.logins = result.logins ? result.logins+1 : 1;
                        collection.update({_id: result._id}, {$set: {lastLogin: new Date(), logins: result.logins}});
                        result.sid = socket.id;
                        delete result.password;

                        StateManager.addUser(result);

                        socket.join('lobby');
                        socket.emit('state:change', 'lobby');
                        socket.broadcast.to('lobby').emit('lobby:user:join', result);
                        ChatManager.botChat(result.username+" joined the lobby");
                    }
                }
            });
        });
    },

    goRegister: function(socket) {
        socket.emit('state:change', 'register');
    }
};

module.exports = WelcomeController;
