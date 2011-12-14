var qs     = require('querystring'),
    crypto = require('crypto');

var StateManager = require('../managers/state'),
    ChatManager  = require('../managers/chat'),
    db           = require('../db'),
    Utils        = require('../shared/utils');


// private
var io = require('../managers/socket').getIO();

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

function _authUser(collection, result, socket) {
    result.logins = result.logins ? result.logins+1 : 1;
    collection.update({_id: result._id}, {$set: {lastLogin: new Date(), logins: result.logins}});
    result.sid = socket.id;
    delete result.password;

    // calculate win streak
    result.winning_streak = 0;
    db.collection('games', function(err, collection) {
        collection
        .find({isFinished: true, $or : [{"challenger.db_id": result._id}, {"challengee.db_id": result._id}]})
        .limit(3)
        .sort({started: -1})
        .toArray(function(err, docs) {
            // a for instead of an each, so we can break if needs be
            for (var i = 0; i < docs.length; i++) {
                if (docs[i].winner != result._id.toString()) {
                    break;
                }
                result.winning_streak ++;
            }
            console.log("streak: "+result.winning_streak);
            // calculate accuracy
            result.accuracy = Utils.calculateAccuracy(result);

            StateManager.addUser(result);
        });
    });

}

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

                        _authUser(collection, result, socket);
                        socket.emit('state:change', 'lobby');
                    }
                }
            });
        });
    },

    goRegister: function(socket) {
        socket.emit('state:change', 'register');
    },

    register: function(socket, data) {
        var details = qs.parse(data);

        var errors = [];
        if (details.username == null ||
            details.username.match(/^[A-z_0-9]{1,20}$/) == null) {
            errors.push("Please enter a valid username");
        }
        if (details.email == null ||
            validateEmail(details.email) == false) {
            errors.push("Please enter a valid email address");
        }
        if (details.password == null ||
            details.password.match(/^.{4,20}$/) == null) {
            errors.push("Please enter a valid password");
        }
        if (errors.length) {
            socket.emit('msg', errors.join("<br />"));
            return;
        }
        db.collection('users', function(err, collection) {
            collection.findOne({ $or : [{"username": details.username}, {"email": details.email}]}, function(err, result) {
                if (result == null) {
                    // superb. register
                    var hash = crypto.createHash('sha1');
                    hash.update(details.password);
                    details.password = hash.digest('hex');
                    details.rank = 0;
                    details.kills = 0;
                    details.deaths = 0;
                    details.defaults = 0;
                    details.wins = 0;
                    details.losses = 0;
                    details.shots = 0;
                    details.hits = 0;
                    details.position = 0;
                    details.registered = new Date();

                    collection.insert(details, function(err, result) {
                        _authUser(collection, result[0], socket);
                        socket.emit('state:change', 'intro');
                    });
                } else {
                    socket.emit('msg', 'Sorry, that username or email address is already in use.');
                }
            });
        });
    },

    introDone: function(socket) {
        socket.emit('state:change', 'lobby');
    }
};

module.exports = WelcomeController;
