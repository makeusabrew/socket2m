(function() {
    $("#login form").submit(function(e) {
        var self = $(this);
        e.preventDefault();
        var data = self.serialize();
        socket.emit("login", data);
    });
})();
