var gameActions = (function() {
        var self = {};
        self.init = function() {
            console.log("game init");
            stateListeners = {
                'game:prepare': function(data) {
                    console.log("preparing game");
                    GameManager.prepare(data);
                },

                'game:start': function() {
                    console.log("starting game...");
                    GameManager.start(socket);
                    // GO!
                    tick();
                },

                'game:weapon:fire': function(options) {
                    GameManager.actuallyFireWeapon(options);
                },

                'game:weapon:fire:wait': function(msec) {
                    GameManager.reloadPlayerWeaponIn(msec);
                },

                'game:powerup:spawn': function(options) {
                    GameManager.actuallySpawnPowerup(options);
                },

                'game:powerup:claim': function(options) {
                    GameManager.actuallyClaimPowerup(options);
                },

                'game:weapon:change': function(type) {
                    GameManager.changePlayerWeapon(type);
                },

                'game:bullet:die': function(options) {
                    //
                },

                'game:player:kill': function(options) {
                    GameManager.actuallyKillPlayer(options);
                },

                'game:player:respawn': function(options) {
                    GameManager.actuallyRespawnPlayer(options);
                },

                'game:player:chat': function(msg) {
                    GameManager.showChatMessage(msg);
                },

                'game:timeup:rejected': function(wait) {
                    GameManager.delayTimeup(wait);
                },

                'game:win': function(stats) {
                    GameManager.handleWin(stats);
                },

                'game:lose': function(stats) {
                    GameManager.handleLose(stats);
                },
                
                'game:cancel': function(options) {
                    GameManager.cancelGame(options);
                },

                'game:suddendeath': function() {
                    GameManager.setSuddenDeath();
                }
            };


        $("#game #volume").click(function(e) {
            e.preventDefault();
            SoundManager.toggleSounds();
        });

        socket.emit('game:ready');
    }
    return self;
})();
