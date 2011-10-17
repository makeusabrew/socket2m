var http = require('http'),
    sio  = require('socket.io');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("OK\n");
});

var io = sio.listen(app);
app.listen(7979);

io.sockets.on('connection', function(socket) {
    socket.emit('statechange', 'login');
});
