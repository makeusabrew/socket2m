var http    = require('http'),
    qs      = require('querystring'),
    mongo   = require('mongodb'),
    sio     = require('socket.io');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("OK\n");
});

var io = sio.listen(app);
app.listen(7979);

var connectedUsers = {};

io.sockets.on('connection', function(socket) {
    socket.emit('statechange', 'login');

    /**
     * login
     */
    socket.on('login', function(data) {
        var details = qs.parse(data);
        db.collection('users', function(err, collection) {
            collection.findOne(details, function(err, result) {
                if (result == null) {
                    socket.emit('msg', 'Invalid details');
                } else {
                    connectedUsers[socket.id] = result;
                    socket.join('lobby');
                    socket.emit('statechange', 'lobby');
                    socket.broadcast.to('lobby').emit('user:join', result);
                }
            });
        });
    });

    /**
     * lobby / user list
     */
    socket.on('userlist', function() {
        socket.emit('userlist', {
            "user": connectedUsers[socket.id],
            "users": connectedUsers
        });
    });

    /**
     * receive challenge request
     */
    socket.on('challenge', function(to) {
        //
    });

    /**
     * disconnect / cleanup
     */
    socket.on('disconnect', function() {
        if (connectedUsers[socket.id] != null) {
            io.sockets.in('lobby').emit('user:leave', connectedUsers[socket.id]._id);
            delete connectedUsers[socket.id];
        }
    });
});

var db = new mongo.Db('nodeshooter', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {}), {});
db.open(function(err, client) {
    if (err) {
        console.log("error opening mongoDb connection "+err);
        throw err;
    }
});
