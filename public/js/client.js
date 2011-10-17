var socket = io.connect(null, {port: 7979});
var currentState = null;

socket.on('statechange', function(state) {
    $.get('/states/'+state+'.html', {}, function(response) {
        $("#wrapper").html(response);

        loadScript('/states/'+state+'.js');

        currentState = state;
        console.log("changed state to "+state);
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
    alert(msg);
});
