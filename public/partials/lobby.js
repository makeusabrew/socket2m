(function() {
    socket.emit('userlist', function(users) {
        console.log("adding users");
    });
})();
