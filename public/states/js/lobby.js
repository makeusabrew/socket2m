(function() {
    // we'll keep a copy of the player's user object
    var user = null;

    function addUser(_user) {
        var _class = (_user.sid == user.sid) ? "me" : "opponent";

        if (_user.rank == null) {
            _user.rank = 0;
        }
        return $("<tr><td data-id='"+_user.sid+"' data-username='"+_user.username+"' class='"+_class+"'>"+_user.username+"</td><td>"+_user.rank+"</td></tr>");
    }

    function bindListeners() {
        $("#users table").unbind('click');
        $("#users table").bind('click', function(e) {
            var elem = $(e.target);
            // jQuery.data() barfs at large ID values, so we have to use attr. Oh well.
            var targetId = elem.attr("data-id");

            if (targetId != null && targetId != user.sid) {
                // excellent! challenge time
                mbconfirm("Do you want to challenge "+elem.data('username')+"?", function(result) {
                    // boom!
                    if (result) {
                        console.log("issuing challenge to "+targetId);
                        socket.emit('lobby:challenge:issue', targetId);
                    }
                }, "Yes", "No");
            }
        });
    }

    function addChatLine(msg) {
        var div = $("<div class='chatline "+msg.type+"'><time datetime='"+msg.timestamp+"'><span class='author'>"+msg.author.username+"</span>: <span class='msg'>"+msg.msg+"</span></time></div>");
        $("#lobby #chat").append(div);
    }

    $("#lobby form").submit(function(e) {
        e.preventDefault();
        var input = $(this).find("input");
        var val = $.trim(input.val());
        if (val.length) {
            input.prop("disabled", true);
            input.val('');
            setTimeout(function() {
                input.prop("disabled", false);
            }, 1500);
                
            socket.emit('lobby:chat', val);
        }
    });

    stateListeners = {
        'lobby:users': function(data) {
            user = data.user;
            console.log('rendering list of users');
            var tbody = $("#users table tbody");
            tbody.hide();
            for (var i in data.users) {
                tbody.append(addUser(data.users[i]));
            }
            tbody.show();

            console.log('adding chat backlog');
            for (var i = 0, j = data.chatlines.length; i < j; i++) {
               addChatLine(data.chatlines[i]); 
            }

            bindListeners();
        },
        'lobby:user:join': function(user) {
            var u = addUser(user);
            u.hide();
            $("#users table").append(u);
            u.fadeIn('slow');

            bindListeners();
        },
        // user leave is a global message so it's not namespaced
        'user:leave': function(id) {
            console.log('received user leave for ID '+id);
            $("#users table tr td[data-id='"+id+"']").parent().fadeOut('slow', function() {
                $(this).remove();
            });
        },
        'lobby:challenge:receive': function(from) {
            mbconfirm("Incoming challenge from "+from.username+" - accept?", function(result) {
                socket.emit('lobby:challenge:respond', result);
            }, "Yes", "No");
        },
        'lobby:challenge:response': function(accepted) {
            if (accepted) {
                console.log("requesting game start...");
                socket.emit('lobby:startgame');
            }
        },
        'lobby:chat': function(msg) {
            addChatLine(msg);
        }
    };

})();

socket.emit('lobby:ready');
