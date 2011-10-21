(function() {
    var user = null;
    function addUser(_user) {
        var _class = (_user.sid == user.sid) ? "me" : "";
        return $("<li data-id='"+_user.sid+"' class='"+_class+"'>"+_user.username+" ("+_user.rank+")</li>");
    }

    function bindListeners() {
        $("#users ul").unbind('dblclick');
        $("#users ul").bind('dblclick', function(e) {
            var elem = $(e.target);
            // jQuery.data() barfs at large ID values, so we have to use attr. Oh well.
            var targetId = elem.attr("data-id");
            if (targetId != null && targetId != user.sid) {
                // excellent! challenge time
                mbconfirm("Do you want to challenge "+elem.html()+"?", function(result) {
                    // boom!
                    if (result) {
                        console.log("issuing challenge to "+targetId);
                        socket.emit('challenge:issue', targetId);
                    }
                }, "Yes", "No");
            }
        });
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
        'userlist': function(data) {
            user = data.user;
            console.log('adding users');
            var ul = $("<ul></ul>");
            for (var i in data.users) {
                ul.append(addUser(data.users[i]));
            }
            $("#users").append(ul);

            bindListeners();
        },
        'user:join': function(user) {
            var li = addUser(user);
            li.hide();
            $("#users ul").append(li);
            li.fadeIn('slow');

            bindListeners();
        } ,
        'user:leave': function(id) {
            $("#users ul li[data-id='"+id+"']").fadeOut('slow', function() {
                $(this).remove();
            });
        },
        'challenge:receive': function(from) {
            mbconfirm("Incoming challenge from "+from.username+" - accept?", function(result) {
                socket.emit('challenge:respond', result);
            }, "Yes", "No");
        },
        'challenge:response': function(accepted) {
            if (accepted) {
                console.log("requesting game start...");
                socket.emit('startgame');
            }
        },
        'lobby:chat': function(msg) {
            var div = $("<div><span class='author'>"+msg.author.username+"</span>: <span class='msg'>"+msg.msg+"</span>");
            $("#lobby #chat").append(div);
        }
    };

})();

socket.emit('lobby:ready');
