var socket = io.connect(null, {port: 7979});
var currentState = null;

socket.on('statechange', function(state) {
    $.get('/states/'+state+'.html', {}, function(response) {
        $("#wrapper").html(response);

        var script = document.createElement("script");
        script.type = 'text/javascript';
        script.src = '/states/'+state+'.js';
        $("body").append(script);

        currentState = state;
        console.log("changed state to "+state);
    });
});

/**
 * very crude message handling for now
 */
socket.on('msg', function(msg) {
    alert(msg);
});
