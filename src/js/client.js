/**
 * let's add a bit of grace if the node server isn't up or responding
 */
var warnHandler = setTimeout(function() {
    $("#wrapper").html("<h2>It doesn't look like the socket2m server is running at the moment. Please come back later.</h2>");
}, 1500);

var socket = (typeof io != 'undefined') ? io.connect(null, {port: 7979}) : {'on':function(){}};
var currentState = null;
var stateListeners = {};
var pageTitle = $("title").html();

if (typeof io == 'undefined') {
    clearTimeout(warnHandler);
    $("#wrapper").html("<h2>The socket2m server is not running at the moment. Please come back later.</h2>");
}

socket.on('connect', function() {
    console.log("connected");
    clearTimeout(warnHandler);
});

socket.on('statechange', function(state) {

    var ts = new Date().getTime(),

        faded    = false,
        data     = null,
        checkComplete = function(_faded, _data) {

        if (_faded != null) {
            console.log("fade out complete");
            faded = _faded;
        }
        if (_data != null) {
            console.log("data complete");
            data = _data;
        }

        if (faded && data) {
            console.log("fade & data complete");
            $("#wrapper").html(data);
            var heading = $("#wrapper h1:first");
            $("#state-wrapper").hide().children("#state-title").html(heading.html());
            $("title").html(pageTitle+" - "+heading.html());

            heading.parent("div.page-header").remove();
            heading.remove();

            $("#state-wrapper").fadeIn('fast');
            $("#wrapper").fadeIn('fast');

            loadScript('/states/js/'+state+'.js?t='+ts);
            currentState = state;
            for (var _event in stateListeners) {
                console.log("binding "+_event+" listener");
                socket.on(_event, stateListeners[_event]);
            }
            console.log("changed state to "+state);
        }
    }
    $("#state-wrapper").fadeOut('fast');
    $("#wrapper").fadeOut('fast', function() {
        checkComplete(true, null);
    });

    // unbind handlers
    for (var _event in stateListeners) {
        console.log("removing "+_event+" listener");
        socket.removeListener(_event, stateListeners[_event]);
    }

    $.get('/states/'+state+'.html?t='+ts, {}, function(response) {
        checkComplete(null, response);
    });
});

/**
 * very crude message handling for now
 */
socket.on('msg', function(msg) {
    mbalert(msg);
});

loadScript("/shared/js/utils.js");
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
