var currentState = null;
var stateListeners = {};
var pageTitle = $("title").html();
var socket = socket || null;
/**
 * storing a global reference to the canvas surface isn't ideal, but it's best for performance
 */
var gSurface = null;

var Client = (function(enabled) {
    var self = {};
    self.start = function() {
        if (!enabled) {
            $("#wrapper").html("<h2>The socket2m server is not running at the moment. Please come back later.</h2>");
            return;
        }

        if (socket == null) {
            socket = io.connect();
        }

        socket.on('connect', function() {
            console.log("connected");
        });

        socket.on('state:change', function(state) {

            var faded    = false,
                data     = null,
                checkComplete = function(_faded, _data) {

                if (_faded != null) {
                    //console.log("fade out complete");
                    faded = _faded;
                }
                if (_data != null) {
                    //console.log("data complete");
                    data = _data;
                }

                if (faded && data) {
                    $("#wrapper").html(data);
                    var heading = $("#wrapper h1:first");
                    $("#state-wrapper").hide().children("#state-title").html(heading.html());
                    $("title").html(pageTitle+" - "+heading.html());

                    heading.parent("div.page-header").remove();
                    heading.remove();

                    $("#state-wrapper").fadeIn('fast');
                    $("#wrapper").fadeIn('fast');

                    // we can't do this, cos we mangle the top level vars
                    // window[state+"Actions"].init();
                    window[state.charAt(0)+"a"].init();
                    currentState = state;
                    for (var _event in stateListeners) {
                        //console.debug("binding "+_event+" listener");
                        socket.on(_event, stateListeners[_event]);
                    }
                    console.log("changed state to "+state);
                    if (typeof _gaq != 'undefined') {
                        _gaq.push(['_trackPageview', '/'+state]);
                    }
                }
            }
            $("#state-wrapper").fadeOut('fast');
            $("#wrapper").fadeOut('fast', function() {
                checkComplete(true, null);
            });

            // unbind handlers
            for (var _event in stateListeners) {
                //console.debug("removing "+_event+" listener");
                socket.removeListener(_event, stateListeners[_event]);
            }

            socket.emit('state:fetch', state, function(response) {
                checkComplete(null, response);
            });
            /*
            $.get('/states/'+state+'.html?t='+ts, {}, function(response) {
                checkComplete(null, response);
            });
            */
        });

        /**
         * very crude message handling for now
         */
        socket.on('msg', function(msg) {
            bootbox.alert(msg);
        });

        loadScript("/shared/js/utils.js");
    }

    self.isTouchDevice = function() {
       return  ('ontouchstart' in document.documentElement);
    }

    self.iOS = function() {
       // this is obviously wrong, but it's a start
       return  ('ontouchstart' in document.documentElement);
    }

    return self;

})(typeof io != 'undefined');


$(function() {
    // preload some sfx - we do this here rather than in game because they seem to cause the odd loading issue
    // which we can't afford in game
    SoundManager.preloadSound("/sounds/bang.wav", "weapon:fire");
    if (!Client.iOS()) {
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
    Client.start();
});

/*
loadScript("/js/input.js");
loadScript("/js/game_manager.js");
loadScript("/js/player.js");
loadScript("/js/platform.js");
loadScript("/js/bullet.js");
loadScript("/js/powerup.js");
loadScript("/js/weapon.js");
loadScript("/js/surface.js");
loadScript("/js/sound_manager.js");

// helpers
loadScript("/js/message_box.js");
*/
