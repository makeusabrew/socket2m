// socketbot is our friendly chat bot. He mimicks the basic attributes
// of real life players - just enough for the chat room, anyway

var db = require('./db');

var SocketBot = {
    /**
     * properties
     */
    object: {
        "username": "socketbot",
        "email"   : "socketbot@paynedigital.com"
    },
    responses: {
        "answer-unsure": [
            "Sorry, I didn't understand that",
            "Excuse me?",
            "Pardon?",
            "What?"
        ],
        "answer-feeling": [
            "I'm great thanks. How are you?",
            "Not too bad thank you!"
        ],
        "greetings": [
            "Hello there!",
            "Hi!",
            "Why hello there!",
            "Hi.",
            "Hello!",
            "Hi there!",
            "Hi there.",
            "Hiya!"
        ],
        "confused": [
            "Huh?",
            "I'm a bit confused...",
            "Did someone mention my name?"
        ],
        "language-warning": [
            "Oi! Language!",
            "How rude!"
        ]
    },

    /**
     * methods
     */
    respondTo: function(msg, cb) {
        // specials first
        if (msg.match(/^socketbot:/)) {
            // specials
            if (msg.match(/^socketbot: who won the last game?/)) {
                db.collection('games', function(err, collection) {
                    collection
                    .find({isFinished: true, cancelled: null})
                    .limit(1)
                    .sort({finished: -1})
                    .toArray(function(err, games) {
                        // do something with games[0] here...
                    });
                });
            }
        } else {
            var type = null;
            if (msg.match(/(hi\b|hello\b|hey\b|hi there\b|morning\b).*(socketbot|everyone|all)/i)) {
                type = "greetings";
            } else if (
                msg.match(/how are you.+socketbot/i) ||
                msg.match(/how's things.+socketbot/i)
            ) {
                type = "answer-feeling";
            } else if (msg.match(/socketbot\?$/i)) {
                type = "answer-unsure";
            } else if (msg.match(/(fuck|cunt|shit\b)/i)) {
                type = "language-warning";
            } else if (msg.match(/socketbot/i)) {
                type = "confused";
            }

            if (type) {
                var index = Math.floor(Math.random()*SocketBot.responses[type].length);
                cb({
                    "text" : SocketBot.responses[type][index],
                    "delay"    : 750 + Math.floor(Math.random()*1251)
                });
            }
            cb(null);
        }
    }
};

module.exports = SocketBot;
