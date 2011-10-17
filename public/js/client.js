var socket = io.connect(null, {port: 7979});

socket.on('statechange', function(state) {
    $.get('/partials/'+state+'.html', {}, function(response) {
        $("#wrapper").html(response);
    });
});
