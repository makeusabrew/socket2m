var ia = (function() {
    var self = {};

    self.init = function() {
        console.log("intro init");
        $("a.proceed").click(function(e) {
            e.preventDefault();
            socket.emit("welcome:intro:done");
        });
    }
    return self;
})();
