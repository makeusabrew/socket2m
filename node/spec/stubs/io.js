var Socket = require("./socket");

var io = {
    sockets: {
        in: function(room) {
            return new Socket(null);
        }
    }
};

module.exports = io;
