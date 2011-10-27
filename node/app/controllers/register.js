var qs = require('querystring');

var db = ('app/db');
var io = require('app/managers/socket').getIO();

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

var RegisterController = {
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
                    details.registered = new Date();
                    collection.insert(details);
                    socket.emit('msg', 'Congratulations, you\'re registered!');
                    socket.emit('statechange', 'welcome');
                } else {
                    socket.emit('msg', 'Sorry, that username or email address is already in use.');
                }
            });
        });
    }
};

module.exports = RegisterController;
