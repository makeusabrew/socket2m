#!/usr/local/bin/node

var express = require('express'),
    app     = express.createServer(),
    io      = require('socket.io').listen(app),
    fs      = require('fs');

var Config = require("./app/config");

var SocketManager = require('./app/managers/socket');
SocketManager.setIO(io);

var StateManager   = require('./app/managers/state');

// controllers
console.log("load controllers");
var StaticController   = require('./app/controllers/static');
var WelcomeController  = require('./app/controllers/welcome');
var GameController     = require('./app/controllers/game');
var LobbyController    = require('./app/controllers/lobby');

// other local stuff
var db          = require('./app/db');
var port        = Config.getValue("port");

app.listen(port);
console.log("listening on port "+port);

db.open(function(err, client) {
    if (err) {
        console.log("error opening mongoDb connection "+err);
        throw err;
    }
    console.log("DB connection opened");
});

app.configure(function() {
    app.use(express.static(__dirname + '/../public'));
    app.set('view engine', 'jade');

    // we have to disable layout to use template inheritence it seems
    app.set('view options', {
        'layout': false
    });
    app.enable('trackStats');
});

app.configure('development', function() {
    console.log("Configuring development app options");
    app.disable('trackStats');
});

io.configure(function() {
    io.set('transports', ['websocket']);
    io.set('log level', 1); // warn
});

io.configure('development', function() {
    console.log("configuring development io options");
    io.set('log level', 2); // debug
});

require('./app/routes')(app);


io.sockets.on('connection', function(socket) {
    socket.emit('state:change', 'welcome');

    socket.on('ping', function(cb) {
        cb((new Date()).getTime());
    });

    socket.on('state:fetch', function(state, cb) {
        cb(StaticController.fetchContentsForState(state));
    });

    /**
     * welcome - loaded
     *
    */
    socket.on('welcome:ready', function() {
        WelcomeController.init(socket);
    });

    /**
     * welcome - login
     */
    socket.on('welcome:login', function(data) {
        WelcomeController.login(socket, data);
    });

    /**
     * welcome -> register
     */
    socket.on('welcome:register', function() {
        WelcomeController.goRegister(socket);
    });

    /**
     * welcome - do registration
     */
    socket.on('welcome:register:done', function(data) {
        WelcomeController.register(socket, data);
    });

    /**
     * welcome - finished intro 
     */
    socket.on('welcome:intro:done', function() {
        WelcomeController.introDone(socket);
    });

    /**
     * lobby / user list
     */
    socket.on('lobby:ready', function() {
        LobbyController.init(socket);
    });

    /**
     * lobby banter
     */
    socket.on('lobby:chat', function(msg) {
        LobbyController.chat(socket, msg);
    });

    /**
     * lobby - user has gone idle
     */
    socket.on('lobby:idle', function() {
        LobbyController.markIdle(socket);
    });

    /**
     * lobby - user has become active 
     */
    socket.on('lobby:active', function() {
        LobbyController.markActive(socket);
    });

    /**
     * receive challenge request
     */
    socket.on('lobby:challenge:issue', function(to) {
        LobbyController.issueChallenge(socket, to);
    });

    /**
     * process challenge response
     */
    socket.on('lobby:challenge:respond', function(accepted) {
        LobbyController.respondToChallenge(socket, accepted);
    });

    /**
     * lobby - got bored waiting, cancel challenge
     */
    socket.on('lobby:challenge:cancel', function(to) {
        LobbyController.cancelChallenge(socket, to);
    });

    /**
     * game start request
     */
    socket.on('lobby:startgame', function() {
        LobbyController.startGame(socket);
    });

    /**
     * game - client ready
     */
    socket.on('game:ready', function() {
        GameController.init(socket);
    });

    /**
     * game - client all set, let's go
     */
    socket.on('game:prepared', function() {
        GameController.start(socket);
    });

    /**
     * game - request a shot (exciting)
     */
    socket.on('game:weapon:fire', function(options) {
        GameController.fireWeapon(socket, options);
    });

    /**
     * game - bullet has killed opponent
     */
    socket.on('game:player:kill', function(data) {
        GameController.killPlayer(socket, data);
    });

    /**
     * game - player banter
     */
    socket.on('game:player:chat', function(msg) {
        GameController.chat(socket, msg);
    });

    /**
     * game - time for a powerup to appear
     */
    socket.on('game:powerup:spawn', function() {
        GameController.spawnPowerup(socket);
    });

    /**
     * game - powerup has been shot
     */
    socket.on('game:powerup:claim', function(options) {
        GameController.claimPowerup(socket, options);
    });

    /**
     * game - player thinks time is up
     */
    socket.on('game:timeup', function() {
        GameController.timeup(socket);
    });

    /**
     * game - player is all done, ready for next state
     */
    socket.on('game:finish', function() {
        GameController.rejoinLobby(socket);
    });

    /**
     * disconnect / cleanup
     */
    socket.on('disconnect', function() {
        // @todo I don't like state manager handling this! But whiich
        // controller should it be handled by?
        StateManager.handleDisconnect(socket);
    });
});
