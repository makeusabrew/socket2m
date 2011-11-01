var ra = (function() {
    var self = {};
    var _values = {
        "email" : "",
        "username": "",
        "password": ""
    };

    self.init = function() {
        console.log("register init");
        $("#register form input").bind("change keyup", function(e) {
            var val = $.trim($(this).val());
            _values[$(this).attr("name")] = val;

            var show = true;
            for (var i in _values) {
                if (!_values[i].length) {
                    show = false;
                    break;
                }
            }
            if (show) {
                $("#register form input").unbind();
                $("#register p.alert-message").fadeIn();
            }
        });

        $("#register form").submit(function(e) {
            e.preventDefault();
            socket.emit("welcome:register:done", $(this).serialize());
        });
    }
    return self;
})();
