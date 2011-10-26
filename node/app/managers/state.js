var StateManager = {
    
    // track the io object
    io: null,

    // keep a cached copy of all authed (lobby, in game) users
    authedUsers: {},

    // keep a copy of any outstanding challenges between players
    challenges: [],

    // keep a copy of all active games in progress
    games: {},

    // cache the last 10 or so chat lines
    chatlines: [],

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
    activePowerups: {}
};

module.exports = StateManager;
