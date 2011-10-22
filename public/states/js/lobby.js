(function() {
    // we'll keep a copy of the player's user object
    var user = null;
    var serverTime = null;
    var gameHandlers = {};

    function addUser(_user) {
        var _class = (_user.sid == user.sid) ? "me" : "opponent";

        if (_user.rank == null) {
            _user.rank = 0;
        }
        return $("<tr><td data-id='"+_user.sid+"' data-username='"+_user.username+"' class='"+_class+"'>"+_user.username+"</td><td>"+_user.rank+"</td></tr>");
    }

    function addGame(game) {
        var started  = new Date(game.started);
        console.log("game started at: "+started.getTime()+ " with duration: "+game.duration+" current TS: "+serverTime.getTime());

        // ok, great. now work out how long that is according to the server's time.
        var remaining = Math.round(((started.getTime() + (game.duration*1000)) - serverTime.getTime()) / 1000);
        var strRemaining = "";

        if (remaining <= 0) {
            strRemaining = "due to finish...";
        } else {
            strRemaining = Utils.formatTime(remaining);

            gameHandlers[game._id] = setInterval(function() {
                remaining --;
                if (remaining <= 0) {
                    clearInterval(gameHandlers[game._id]);
                    $("td[data-game-time='"+game._id+"']").html("due to finish...");
                } else {
                    $("td[data-game-time='"+game._id+"']").html(Utils.formatTime(remaining));
                }
            }, 1000);
        }

        return $("<tr data-id='"+game._id+"'><td>"+game.challenger.username+" Vs "+game.challengee.username+"</td><td data-game-time='"+game._id+"'>"+strRemaining+"</td>");
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
        var time = new Date(msg.timestamp);
        var div = $("<div class='chatline "+msg.type+"'><time datetime='"+msg.timestamp+"'>"+Utils.formatDate(time)+"</time><span class='author'>"+msg.author.username+"</span>: <span class='msg'>"+msg.msg+"</span></div>");
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
            serverTime = new Date(data.timestamp);
            user = data.user;
            console.log("lobby state", data);
            var tbody = $("#users table tbody");
            tbody.hide();
            for (var i in data.users) {
                tbody.append(addUser(data.users[i]));
            }
            tbody.show();

            var games = $("#games table tbody");
            games.hide();
            for (var i in data.games) {
                games.append(addGame(data.games[i]));
            }
            games.show();

            for (var i = 0, j = data.chatlines.length; i < j; i++) {
               addChatLine(data.chatlines[i]); 
            }

            bindListeners();
        },
        'lobby:user:join': function(user) {
            console.log("user joining lobby", user);
            var u = addUser(user);
            u.hide();
            $("#users table tbody").append(u);
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
        'lobby:game:start': function(game) {
            console.log("game starting", game);
            serverTime = new Date(game.started);
            var g = addGame(game);
            g.hide();
            $("#games table tbody").append(g);
            g.fadeIn('slow');
        },
        'lobby:game:end': function(id) {
            console.log('received game end for ID '+id);
            clearInterval(gameHandlers[id]);
            $("#games table tr[data-id='"+id+"']").fadeOut('slow', function() {
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
