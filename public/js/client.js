var socket = io.connect(null, {port: 7979});

socket.on('statechange', function(state) {
    $.get('/partials/'+state+'.html', {}, function(response) {
        $("#wrapper").html(response);
        var script = document.createElement("script");
        script.type = 'text/javascript';
        script.src = '/partials/'+state+'.js';
        $("body").append(script);
        console.log("changed state to "+state);
    });
});
