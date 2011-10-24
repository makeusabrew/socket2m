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
            "Excuse me?"
        ],
        "greetings": [
            "Hello there!",
            "Hi!"
        ]
    },

    /**
     * methods
     */
    respondTo: function(msg) {
        var type = null;
        if (msg.match(/(hi|hello|hey|hi there|morning).+(socketbot|everyone)/i)) {
            type = "greetings";
        } else if (msg.match(/socketbot\?$/i)) {
            type = "answer-unsure";
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
