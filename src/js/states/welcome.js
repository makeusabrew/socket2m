var welcomeActions = (function() {
    self = {};
    self.init = function() {
        console.log("welcome init");
        $("#login form").submit(function(e) {
            e.preventDefault();
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

        // preload some sfx - we do this here rather than in game because they seem to cause the odd loading issue
        // which we can't afford in game
        SoundManager.preloadSound("/sounds/bang.wav", "weapon:fire");
        SoundManager.preloadSound("/sounds/applause.wav", "player:kill");
        SoundManager.preloadSound("/sounds/boo.wav", "player:die");
        SoundManager.preloadSound("/sounds/chat.wav", "chat");
        SoundManager.preloadSound("/sounds/sudden_death.wav", "game:suddendeath");
        SoundManager.preloadSound("/sounds/win.wav", "game:win");
        SoundManager.preloadSound("/sounds/lose.wav", "game:lose");
        SoundManager.preloadSound("/sounds/teleport.wav", "player:teleport");
        SoundManager.preloadSound("/sounds/weapon.wav", "weapon:change");
        SoundManager.preloadSound("/sounds/powerup.wav", "game:powerup:spawn");

    }
    return self;
})();
