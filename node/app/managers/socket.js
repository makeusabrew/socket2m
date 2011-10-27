console.log("init socket manager");
var io = null;
var SocketManager = {
    setIO: function(_io) {
        io = _io;
    },

    getIO: function() {
        return io;
    }
};

module.exports = SocketManager;
