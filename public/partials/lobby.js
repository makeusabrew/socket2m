(function() {
    var user = null;
    function addUser(user) {
        return $("<li data-id='"+user._id+"'>"+user.username+"</li>");
    }

    function bindListeners() {
        $("#users ul").unbind('dblclick');
        $("#users ul").bind('dblclick', function(e) {
            var elem = $(e.target);
            if (elem.data('id') != null && elem.data('id') != user._id) {
                // excellent! challenge time
                if (confirm("Do you want to challenge "+elem.html()+"?")) {
                    // boom!
                    console.log("issuing challenge to "+elem.data('id'));
                    socket.emit('challenge:issue', elem.data('id'));
                }
            }
        });
    }

    socket.on('userlist', function(data) {
        user = data.user;
        console.log('adding users');
        var ul = $("<ul></ul>");
        for (var i in data.users) {
            ul.append(addUser(data.users[i]));
        }
        $("#users").append(ul);

        bindListeners();
    });

    socket.on('user:join', function(user) {
        var li = addUser(user);
        li.hide();
        $("#users ul").append(li);
        li.fadeIn('slow');

        bindListeners();
    });

    socket.on('user:leave', function(id) {
        $("#users ul li[data-id='"+id+"']").fadeOut('slow', function() {
            $(this).remove();
        });
    });

    socket.on('challenge:receive', function(from) {
        socket.emit('challenge:respond', confirm("Incoming challenge from "+from.username+" - accept?"));
    });

    socket.on('challenge:response', function(accepted) {
        if (accepted) {
            console.log("requesting game start...");
            socket.emit('game:start');
        }
    });

    socket.emit('userlist');
})();
