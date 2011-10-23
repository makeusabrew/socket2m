(function() {
    this.mbalert = function(str, cb) {
        var div = $([
            "<div class='modal hide fade'>",
                "<div class='modal-body'>",
                    str,
                "</div>",
                "<div class='modal-footer'>",
                    "<a class='btn primary' href='#'>OK</a>",
                "</div>",
            "</div>"
        ].join("\n"));

        $("body").append(div);

        div.bind('hidden', function() {
            div.remove();
        });

        div.bind('shown', function() {
            $("a.primary", div).focus();
        });

        div.bind('hide', function() {
            if (typeof cb == 'function') {
                cb();
            }
        });

        $("a", div).click(function(e) {
            e.preventDefault();
            div.modal("hide");
        });

        div.modal({
            "backdrop" : "static",
            "keyboard" : true,
            "show"     : true
        });

    };

    this.mbconfirm = function(str, cb, okStr, cancelStr) {
        if (okStr == null) {
            okStr = "OK";
        }
        if (cancelStr == null) {
            cancelStr = "Cancel";
        }
        var _confirmed = false;
        var div = $([
            "<div class='modal hide fade'>",
                "<div class='modal-body'>",
                    str,
                "</div>",
                "<div class='modal-footer'>",
                    "<a class='btn primary' href='#'>"+okStr+"</a>",
                    "<a class='btn danger' href='#'>"+cancelStr+"</a>",
                "</div>",
            "</div>"
        ].join("\n"));

        $("body").append(div);

        div.bind('hidden', function() {
            div.remove();
        });

        div.bind('hide', function() {
            if (!_confirmed && typeof cb == 'function') {
                //  assume then that we don't want to confirm
                cb(false);
            }
        });

        div.bind('shown', function() {
            $("a.primary", div).focus();
        });

        $("a", div).click(function(e) {
            _confirmed = true;
            var _confirm = $(this).hasClass("primary");
            e.preventDefault();
            div.modal("hide");
            if (typeof cb == 'function') {
                cb(_confirm);
            }
        });

        div.modal({
            "backdrop" : "static",
            "show"     : true
        });
    }
})();

loadScript("/js/deps/bootstrap-modal.1.3.0.js");
