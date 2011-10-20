(function() {
    $("#login form").submit(function(e) {
        e.preventDefault();
        socket.emit("login", $(this).serialize());
    });

    $("#login a.register").click(function(e) {
        e.preventDefault();
        socket.emit("login:register");
    });
})();
