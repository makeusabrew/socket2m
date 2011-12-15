// socketbot is our friendly chat bot. He mimicks the basic attributes
// of real life players - just enough for the chat room, anyway

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
            "Pardon?"
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
    respondTo: function(msg) {
        var type = null;
        if (msg.match(/(hi|hello|hey|hi there|morning).+(socketbot|everyone|all)/i)) {
            type = "greetings";
        } else if (msg.match(/how are you.+socketbot/i)) {
            type = "answer-feeling";
        } else if (msg.match(/socketbot\?$/i)) {
            type = "answer-unsure";
        } else if (msg.match(/(fuck|cunt)/i)) {
            type = "language-warning";
        } else if (msg.match(/socketbot/i)) {
            type = "confused";
        }

        if (type) {
            var index = Math.floor(Math.random()*SocketBot.responses[type].length);
            return {
                "text" : SocketBot.responses[type][index],
                "delay"    : 750 + Math.floor(Math.random()*1251)
            };
        }
        return null;
    }
};

module.exports = SocketBot;
