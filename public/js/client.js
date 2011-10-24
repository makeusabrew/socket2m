/**
 * let's add a bit of grace if the node server isn't up or responding
 */
$("#wrapper").html("Loading...");
var warnHandler = setTimeout(function() {
    $("#wrapper").html("<h2>It doesn't look like the socket2m server is running at the moment. Please come back later.</h2>");
}, 1500);

var socket = (typeof io != 'undefined') ? io.connect(null, {port: 7979}) : {'on':function(){}};
var currentState = null;
var stateListeners = {};

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
            var heading = $("#wrapper h2:first");
            $("#state-wrapper").hide().children("#state-title").html(heading.html());

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

function loadScript(src, async) {
    if (async == null) {
        async = false;
    }
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.src = src;
    if (async) {
        script.async = async;
    }
    $("body").append(script);
}

function tweetButton(opts) {
    var text = opts.text ? opts.text : "";
    var count = opts.count ? opts.count : "";
    return '<iframe allowtransparency="true" frameborder="0" scrolling="no" '+
    'src="//platform.twitter.com/widgets/tweet_button.html?'+
    'text='+encodeURIComponent(text)+'&'+
    'count='+encodeURIComponent(count)+'" '+
    'style="width:130px; height:20px;"></iframe>';
}

/**
 * very crude message handling for now
 */
socket.on('msg', function(msg) {
    mbalert(msg);
});

// requestAnimFrame / cancelRequestanimFrame shims: http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function(/* function */ callback, /* DOMElement */ element){
            return window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame     ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
} )();

loadScript("/js/utils.js");
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

// social gubbins
loadScript("https://apis.google.com/js/plusone.js", true);
loadScript("//platform.twitter.com/widgets.js");
$("body").prepend('<div id="fb-root"></div>');
loadScript("//connect.facebook.net/en_US/all.js#xfbml=1");
