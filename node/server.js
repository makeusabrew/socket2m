var http = require('http'),
    qs   = require('querystring'),
    sio  = require('socket.io');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("OK\n");
});

var io = sio.listen(app);
app.listen(7979);

io.sockets.on('connection', function(socket) {
    socket.emit('statechange', 'login');
    socket.on('login', function(data) {
        var details = qs.parse(data);
        console.log(details);
    });
});
