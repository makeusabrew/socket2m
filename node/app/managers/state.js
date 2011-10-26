// private stuff
// keep a copy of any outstanding challenges between players
var challenges = [];

// keep a copy of all active games in progress
var games = {};

var StateManager = {
    
    // track the io object
    io: null,

    // keep a cached copy of all authed (lobby, in game) users
    authedUsers: {},


    // weapon types
    weapons: {
        "0" : {
            "reload"  : 2000,
            "bullets" : 1,
            "fuzz"    : 0
        },
        "1" : {
            "reload"  : 3000,
            "bullets" : 4,
            "fuzz"    : 5 
        }
    },

    // powerup types
    powerups: {
        "0" : {
            "letter": "T"
        },
        "1" : {
            "letter": "S"
        },
        "2" : {
            "letter": "P"
        }
    },

    // keep track of the active powerups in each game
    activePowerups: {},

    findChallenge: function(who, id, remove) {
        if (remove == null) {
            remove = false;
        }

        for (var i = 0, j = challenges.length; i < j; i++) {
            //if ((who == 'any' && challenges[i]['to'] == id || challenges[i]['from'] == id) ||
            var challenge = null;
            if (who =='any') {
                if (challenges[i].from == id || challenges[i].to == id) {
                   challenge = challenges[i]; 
                }
            } else if (challenges[i][who] == id) {
                challenge = challenges[i];
            }
            if (challenge) {
                if (remove) {
                    challenges.splice(i, 1);
                }
                return challenge;
            }
        }
        return null;
    },

    addChallenge: function(data) {
        challenges.push(data);
    },

    addGame: function(game) {
        // @todo can we switch to an array here instead?
        games[game._id] = game;
    },

    findGameForSocketId: function(sid) {
        for (var i in games) {
            if (games[i].challenger.socket_id == sid ||
                games[i].challengee.socket_id == sid) {
                return games[i];
            }
        }
        return null;
    },

    getRandomPlatform: function(current) {
        var _platforms = 3;
        if (current == null) {
            current = -1;
        }
        var platform;
        do {
            platform = Math.floor(Math.random()*_platforms);
        } while (platform == current);
        return platform;
    }
};

module.exports = StateManager;
