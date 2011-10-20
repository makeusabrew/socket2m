var socket = io.connect(null, {port: 7979});
var currentState = null;

socket.on('statechange', function(state) {

    var faded    = false,
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
            $("#wrapper").html(data).fadeIn('fast');
            loadScript('/states/js/'+state+'.js');
            currentState = state;
            console.log("changed state to "+state);
        }
    }
        
    $("#wrapper").fadeOut('fast', function() {
        checkComplete(true, null);
    });

    $.get('/states/'+state+'.html', {}, function(response) {
        checkComplete(null, response);
    });
});

function loadScript(src) {
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.src = src;
    $("body").append(script);
}

/**
 * very crude message handling for now
 */
socket.on('msg', function(msg) {
    mbalert(msg);
});

// requestAnim shim layer by Paul Irish
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
            };
})();

loadScript("/js/input.js");
loadScript("/js/game_manager.js");
loadScript("/js/player.js");
loadScript("/js/bullet.js");
loadScript("/js/weapon.js");
loadScript("/js/surface.js");
loadScript("/js/sound_manager.js");

// helpers
loadScript("/js/message_box.js");
