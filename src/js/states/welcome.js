var welcomeActions = (function() {
    self = {};
    self.init = function() {
        console.log("welcome init");
            
        $("#login form").submit(function(e) {
            e.preventDefault();
            if (Client.iOS()) {
                SoundManager.playSound("weapon:fire");
                SoundManager.pauseSound("weapon:fire");
                //SoundManager.bootSounds();
            }

            socket.emit("welcome:login", $(this).serialize());
        });

        $("#login a.register").click(function(e) {
            e.preventDefault();
            socket.emit("welcome:register");
        });

        stateListeners = {
            'welcome:count': function(data) {
                var uCount = data.users;
                var uPrefix = uCount != 1 ? "are" : "is";
                var uString = uCount != 1 ? "users" : "user";

                var gCount = data.games;
                var gString = gCount != 1 ? "games" : "game";
                $("#login form").after(
                    "<p>There "+uPrefix+" <strong>"+uCount+"</strong> "+uString+" in the lobby and <strong>"+gCount+"</strong> "+gString+" in progress right now.</p>"
                );
            }
        };
        socket.emit("welcome:ready");

    }
    return self;
})();
