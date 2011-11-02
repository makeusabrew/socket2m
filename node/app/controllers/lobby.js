var ChatManager = require('app/managers/chat');
var StateManager = require('app/managers/state');
var db = require('app/db');
var io = require('app/managers/socket').getIO();

var LobbyController = {
    init: function(socket) {
        // @see #639 - lobby join race condition
        // the problem is that in order for another user to receive initial
        // lobby info, they have to have *all* lobby listeners bound
        // so if they emit lobby:ready as we emit lobby:user:join, they might
        // get us in LobbyController.init AND as a result of emit() below
        // hmm
        socket.broadcast.to('lobby').emit('lobby:user:join', StateManager.getUserForSocket(socket.id));
        ChatManager.botChat(StateManager.getUserForSocket(socket.id).username+" joined the lobby");
        socket.join('lobby');

        var _sockets = io.sockets.clients('lobby');
        var users = [];
        for (var i = 0, j = _sockets.length; i < j; i++) {
            users.push(StateManager.getUserForSocket([_sockets[i].id]));
        }

        // simply convert the games object to an array
        var activeGames = [];
        var games = StateManager.getGames();
        for (var i in games) {
            if (games[i].started != null) {
                // we only care about games which have been *started*, not necessarily "created"
                activeGames.push(games[i]);
            }
        }

        socket.emit('lobby:users', {
            "timestamp": new Date(),
            "user": StateManager.getUserForSocket([socket.id]),
            "users": users,
            "games": activeGames,
            "chatlines": ChatManager.getChatlines()
        });
    },

    chat: function(socket, msg) {
        ChatManager.lobbyChat(StateManager.getUserForSocket([socket.id]), msg);
    },

    issueChallenge: function(socket, to) {
        // make sure the ID we're challenging is in the lobby
        // FIXME this line won't work - this gets us all sockets which means we can challenge ANYONE!
        var _sockets = io.sockets.in('lobby').sockets;
        if (_sockets[to] != null) {
            var challenge = StateManager.findChallenge('any', to);
            if (challenge == null) {
                // excellent! Issue the challenge from the challenger's user object
                StateManager.addChallenge({
                    "from" : socket.id,
                    "to"   : to 
                });
                _sockets[to].emit('lobby:challenge:receive', StateManager.getUserForSocket([socket.id]));
                socket.emit('lobby:challenge:confirm', to);
            } else {
                // can't challenge, already got one
                console.log('Cannot issue challenge - ID already has one outstanding');
                socket.emit('lobby:challenge:blocked');
            }
        } else {
            console.log("Could not find ID to challenge in lobby "+to);
        }
    },

    respondToChallenge: function(socket, accepted) {
        // the third arg here deletes the challenge from the challenges array
        var challenge = StateManager.findChallenge('to', socket.id, true);

        if (challenge != null) {
            console.log("challenge from "+challenge.from+" to "+challenge.to+": "+accepted);
            var _sockets = [
                io.sockets.sockets[challenge.to],
                io.sockets.sockets[challenge.from]
            ];
            if (accepted) {
                db.collection('games', function(err, collection) {
                    
                    var game = {
                        "created"       : new Date(),
                        "started"       : null,
                        "challenger" : {
                            "db_id"     : StateManager.getUserForSocket([challenge.from])._id,
                            "username"  : StateManager.getUserForSocket([challenge.from]).username,
                            "socket_id" : challenge.from,
                            "platform"  : StateManager.getRandomPlatform(),
                            "x"         : 16,
                            "a"         : 315,
                            "v"         : Math.floor(Math.random()* 150) + 25,
                            "score"     : 0,
                            "shots"     : 0,
                            "hits"      : 0
                        },
                        "challengee" : {
                            "db_id"     : StateManager.getUserForSocket([challenge.to])._id,
                            "username"  : StateManager.getUserForSocket([challenge.to]).username,
                            "socket_id" : challenge.to,
                            "platform"  : StateManager.getRandomPlatform(),
                            "x"         : 908,
                            "a"         : 225,
                            "v"         : Math.floor(Math.random()* 150) + 25,
                            "score"     : 0,
                            "shots"     : 0,
                            "hits"      : 0
                        },
                        "entityId" : 0,
                        "duration": 90,
                        "cancelled": false
                    };
                    collection.insert(game, function(err, result) {
                        StateManager.addGame(result[0]);
                    });
                });

                for (var i = 0; i < 2; i++) {
                    _sockets[i].leave('lobby');
                    // @todo can we actually hook into event listeners on join / leave instead? probably...
                    io.sockets.emit('user:leave', _sockets[i].id);
                }
            }
            for (var i = 0; i < 2; i++) {
                _sockets[i].emit('lobby:challenge:response', {
                    "accepted": accepted,
                    "to": socket.id
                });
            }
        } else {
            console.log("Could not find challenge");
        }
    },

    cancelChallenge: function(socket, to) {
        var challenge = StateManager.findChallenge('to', to, true);
        if (challenge == null) {
            console.log("invalid challenge");
            socket.emit("lobby:challenge:cancel:invalid");
            return;
        }

        console.log("challenge from "+challenge.from+" to "+challenge.to+": cancelled");
        if (io.sockets.sockets[challenge.to]) {
            // feasibly, a reason the challenger withdrew is because the opponent left
            // @todo perhaps handle this globally - e.g delete the challenge object
            // when a user leaves instead?
            io.sockets.sockets[challenge.to].emit("lobby:challenge:cancel");
        }
    },

    startGame: function(socket) {
        // is this user allowed - e.g. do they have an active game?
        var game = StateManager.findGameForSocketId(socket.id);
        if (game == null) {
            console.log("could not find game for socket ID "+socket.id+" in "+arguments.callee);
            return;
        }

        socket.emit('state:change', 'game');
    }
};

module.exports = LobbyController;
