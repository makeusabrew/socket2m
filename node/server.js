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
                    socket.emit('statechange', 'lobby');
                }
            });
        });
    });

    /**
     * lobby / user list
     */
    socket.on('userlist', function() {
        socket.emit('userlist', connectedUsers);
    });

    /**
     * disconnect / cleanup
     */
    socket.on('disconnect', function() {
        if (connectedUsers[socket.id] != null) {
            delete collectedUsers[socket.id];
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
