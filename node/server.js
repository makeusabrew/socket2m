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

var authedUsers = {};
var challenges = [];
var games = {};

io.sockets.on('connection', function(socket) {
    //console.log(io.sockets);
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
                    result.sid = socket.id;
                    authedUsers[socket.id] = result;
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
    socket.on('lobby:ready', function() {
        socket.emit('userlist', {
            "user": authedUsers[socket.id],
            "users": authedUsers
        });
    });

    /**
     * receive challenge request
     */
    socket.on('challenge:issue', function(to) {
        // make sure the ID we're challenging is in the lobby
        var _sockets = io.sockets.in('lobby').sockets;
        if (_sockets[to] != null) {
            // excellent! Issue the challenge from the challenger's user object
            challenges.push({
                "from" : socket.id,
                "to"   : to 
            });
            _sockets[to].emit('challenge:receive', authedUsers[socket.id]);
        } else {
            console.log("Could not find ID to challenge in lobby "+to);
        }
    });

    /**
     * process challenge response
     */
    socket.on('challenge:respond', function(accepted) {
        var challenge = null;

        // we can't just do a normal for loop here, because challenges
        // won't be zero-indexed after the first one has been deleted
        //for (var i in challenges) {
        for (var i = 0, j = challenges.length; i < j; i++) {
            if (challenges[i].to == socket.id) {
                // excellent, this is the challenge we're after
                var challenge = challenges[i];
                //delete challenges[i];
                challenges.splice(i, 1);
                break;
            }
        }

        if (challenge != null) {
            console.log("challenge from "+challenge.from+" to "+challenge.to+": "+accepted);
            var _sockets = [
                io.sockets.sockets[challenge.to],
                io.sockets.sockets[challenge.from]
            ];
            if (accepted) {
                db.collection('games', function(err, collection) {
                    var game = {
                        "started"       : new Date(),
                        "challenger" : {
                            "db_id"     : authedUsers[challenge.from]._id,
                            "socket_id" : challenge.from
                        },
                        "challengee" : {
                            "db_id"     : authedUsers[challenge.to]._id,
                            "socket_id" : challenge.to
                        }
                    };
                    collection.insert(game, function(err, result) {
                        game = result[0];
                        games[game._id] = game;
                    });
                });

                for (var i = 0; i < 2; i++) {
                    _sockets[i].leave('lobby');
                }
            }
            for (var i = 0; i < 2; i++) {
                _sockets[i].emit('challenge:response', accepted);
            }
        } else {
            console.log("Could not find challenge");
        }
    });

    /**
     * game start request
     */
    socket.on('startgame', function() {
        // is this user allowed - e.g. do they have an active game?
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            socket.emit('statechange', 'game');
        } else {
            console.log("could not find game for socket ID "+socket.id);
        }
    });

    /**
     * game - client ready
     */
    socket.on('game:ready', function() {
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            console.log("Socket ID "+socket.id+" ready to play");
            socket.join("game_"+game._id);

            var playerCount = io.sockets.clients('game_'+game._id).length;
            console.log("players present: "+playerCount);
            if (playerCount == 2) {
                var players = null;
                getGamePlayers(game, function(docs) {
                    players = docs;
                    io.sockets.in('game_'+game._id).emit('game:start', {
                        "user": authedUsers[socket.id],
                        "players": players
                    });
                });
            }
        } else {
            console.log("could not find game for socket ID "+socket.id);
        }
    });

    /**
     * game - bullet spawn request (exciting)
     */
    socket.on('game:bullet:spawn', function(options) {
        /**
         * @todo - verify authenticity of the spawn request
         * - can the player fire? (too soon?)
         * - can the player fire from here?
         * - etc
         */
        var game = findGameForSocketId(socket.id);
        if (game != null) {
            io.sockets.in('game_'+game._id).emit('game:bullet:spawn', options);
        } else {
            console.log("could not find game for socket ID "+socket.id+" in game:bullet:spawn");
        }
    });

    /**
     * disconnect / cleanup
     */
    socket.on('disconnect', function() {
        if (authedUsers[socket.id] != null) {
            io.sockets.in('lobby').emit('user:leave', socket.id);
            delete authedUsers[socket.id];
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

function findGameForSocketId(sid) {
    for (var i in games) {
        if (games[i].challenger.socket_id == sid ||
            games[i].challengee.socket_id == sid) {
            return games[i];
        }
    }
    return null;
}

function getGamePlayers(game, cb) {
    var players = null;
    db.collection('users', function(err, collection) {
        collection.find({ $or : [{"_id": game.challenger.db_id}, {"_id": game.challengee.db_id}]}, function(err, cursor) {
            cursor.toArray(function(err, docs) {
                for (var i = 0, j = docs.length; i < j; i++) {
                    delete docs[i].password;
                }
                cb(docs);
            });
        });
    });
}
