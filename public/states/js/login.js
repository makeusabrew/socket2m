(function() {
    $("#login form").submit(function(e) {
        e.preventDefault();
        socket.emit("login:login", $(this).serialize());
    });

    $("#login a.register").click(function(e) {
        e.preventDefault();
        socket.emit("login:register");
    });
})();

socket.emit("login:ready");
