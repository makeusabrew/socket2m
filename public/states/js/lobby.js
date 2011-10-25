(function() {
    // we'll keep a copy of the player's user object
    var user = null;
    var serverTime = null;
    var gameHandlers = {};
    var hasOutstandingChallenge = false;

    function addUser(_user) {
        var _class = (_user.sid == user.sid) ? "me" : "opponent";

        if (_user.rank == null) {
            _user.rank = 0;
        }
        if (_user.wins == null) {
            _user.wins = 0;
        }
        if (_user.losses == null) {
            _user.losses = 0;
        }
        return $("<tr><td data-id='"+_user.sid+"' data-username='"+_user.username+"' data-rank='"+_user.rank+"' class='"+_class+"'>"+_user.username+"</td><td>"+_user.rank+"</td><td>"+_user.wins+"</td><td>"+_user.losses+"</td></tr>");
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

        return $("<tr data-id='"+game._id+"'><td>"+game.challenger.username+" Vs "+game.challengee.username+"</td><td><span class='challenger'>"+game.challenger.score+"</span> - <span class='challengee'>"+game.challengee.score+"</span></td><td data-game-time='"+game._id+"'>"+strRemaining+"</td>");
    }

    function bindListeners() {
        $("#users table").unbind('click');
        $("#users table").bind('click', function(e) {
            var elem = $(e.target);
            // jQuery.data() barfs at large ID values, so we have to use attr. Oh well.
            var targetId = elem.attr("data-id");

            if (targetId != null && targetId != user.sid) {
                // excellent! challenge time
                if (hasOutstandingChallenge) {
                    mbalert("You've got a challenge outstanding - please wait.");
                } else {
                    hasOutstandingChallenge = true;
                    var stakeBlurb = getStakes(user, {"rank":elem.data('rank')});
                    var html = "<p>Do you want to challenge <strong>"+elem.data('username')+"</strong>? "+
                    stakeBlurb+
                    "<h4 class='challenge'>Issue the challenge?</h4>";
                    mbconfirm(html, function(result) {
                        // boom!
                        if (result) {
                            console.log("issuing challenge to "+targetId);
                            socket.emit('lobby:challenge:issue', targetId);
                        }
                    }, "Yes", "No");
                }
            }
        });
    }

    function addChatLine(msg) {
        var time = new Date(msg.timestamp);
        var div = $("<div class='chatline "+msg.type+"'><time datetime='"+msg.timestamp+"'>"+Utils.formatDate(time)+"</time><span class='author'>"+msg.author.username+"</span>: <span class='msg'>"+msg.msg+"</span></div>");
        $("#lobby #chat").append(div);
    }

    function getStakes(user, opponent) {
        var winPoints = "";
        var losePoints = "";
        var rankingDiff = "";

        if (user.rank > opponent.rank) {
            rankingDiff = "lower than";
            winPoints = "increase by <strong>one</strong> point";
            losePoints = "decrease by <strong>two</strong> points";
        } else if (user.rank < opponent.rank) {
            rankingDiff = "higher than";
            winPoints = "increase by <strong>three</strong> points";
            losePoints = "not change";
        } else {
            rankingDiff = "the same as";
            winPoints = "increase by <strong>two</strong> points";
            losePoints = "decrease by <strong>one</strong> point";
        }

        if (user.rank <= 0) {
            losePoints = "not change as you are currently unranked";
        }

        return "Their rank is currently <strong>"+opponent.rank+"</strong>, which is "+rankingDiff+" yours.</p>"+
        "<h3>If you win...</h3>"+
        "<p>Your ranking will "+winPoints+".</p>"+
        "<h3>But if you lose...</h3>"+
        "<p>Your ranking will "+losePoints+".</p>";
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
            }, 250);
                
            socket.emit('lobby:chat', val);
        }
    });

    stateListeners = {
        'lobby:users': function(data) {
            var i, j;
            serverTime = new Date(data.timestamp);
            user = data.user;
            console.log("lobby state", data);
            var tbody = $("#users table tbody");
            tbody.hide();
            for (i = 0, j = data.users.length; i < j; i++) {
                tbody.append(addUser(data.users[i]));
            }
            tbody.show();
            if (data.users.length < 2) {
                $("#tweet-challengers #tweet-frame").html(tweetButton({
                    "text": "I'm in the #socket2m lobby - come and challenge me to a duel!",
                    "count": "none"
                }));
                $("#tweet-challengers").show();
            }

            var games = $("#games table tbody");
            games.hide();
            // @todo change this! it's just an array, not an object
            for (i = 0, j = data.games.length; i < j; i++) {
                games.append(addGame(data.games[i]));
            }
            games.show();
            if (data.games.length == 0) {
                games.append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>");
            }

            for (i = 0, j = data.chatlines.length; i < j; i++) {
               addChatLine(data.chatlines[i]); 
            }

            bindListeners();
        },
        'lobby:user:join': function(user) {
            console.log("user joining lobby", user);
            var u = addUser(user);
            $("#users table tbody").append(u);
            // put the hide *after* DOM insertion to fix FF issues
            u.hide();
            u.fadeIn('slow');
            
            // well, if anyone else joined, obviously we're not alone
            $("#tweet-challengers").hide();

            bindListeners();
        },
        // user leave is a global message so it's not namespaced
        'user:leave': function(id) {
            console.log('received user leave for ID '+id);
            $("#users table tbody tr td[data-id='"+id+"']").parent().fadeOut('slow', function() {
                $(this).remove();
                if ($("#users table tbody tr").length < 2) {
                    $("#tweet-challengers #tweet-frame").html(tweetButton({
                        "text": "I'm in the #socket2m lobby - come and challenge me to a duel!",
                        "count": "none"
                    }));
                    $("#tweet-challengers").fadeIn('slow');
                }
            });
        },
        'lobby:game:start': function(game) {
            console.log("game starting", game);
            serverTime = new Date(game.started);
            var g = addGame(game);
            $("#games table tr.placeholder").remove();
            $("#games table tbody").append(g);
            g.hide();
            g.fadeIn('slow');
        },
        'lobby:game:end': function(id) {
            console.log('received game end for ID '+id);
            clearInterval(gameHandlers[id]);
            $("#games table tr[data-id='"+id+"']").fadeOut('slow', function() {
                $(this).remove();
                if ($("#games table tbody tr").length == 0) {
                    $("#games table tbody").append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>");
                }
            });
        },
        'lobby:challenge:receive': function(from) {
            var stakeBlurb = getStakes(user, from);
            var html = 
            "<h2>Incoming challenge!</h2>"+
            "<p>You've received a challenge from <strong>"+from.username+"</strong>. "+
            stakeBlurb+
            "<h4 class='challenge'>Accept the challenge?</h4>";

            mbconfirm(html, function(result) {
                socket.emit('lobby:challenge:respond', result);
            }, "Yes", "No");
        },
        'lobby:challenge:response': function(data) {
            hasOutstandingChallenge = false;
            // hide any other modals
            $(".modal").modal("hide");
            if (data.accepted) {
                console.log("requesting game start...");
                socket.emit('lobby:startgame');
            } else if (data.to != user.sid) {
                mbalert("The opponent declined your challenge.");
            }
        },
        'lobby:challenge:blocked': function() {
            hasOutstandingChallenge = false;
            mbalert("Sorry, this user has just challenged (or been challenged by) someone else. Try again in a moment.");
        },
        'lobby:challenge:cancel': function() {
            // user cancelled their challenge against us
            // presumably we've got a modal in our face, so get rid
            $(".modal").modal("hide");
            mbalert("The opponent withdrew their challenge.");
        },
        'lobby:challenge:cancel:invalid': function() {
            console.log("could not cancel challenge");
            // do we care? we tried to cancel but couldn't. so what?
        },
        'lobby:challenge:confirm': function(to) {
            mbmodal(
                "<p>You challenge has been issued. If your opponent accepts it your game will begin immediately. You'll be notified if they reject it.</p>"+
                "<p>You can't challenge anyone else - and nobody can challenge you - while you wait for your opponent's decision. If "+
                "you don't hear anything you can cancel this challenge whenever you wish.</p>"
            , {
                "Withdraw challenge": {
                    "class"    : "danger", 
                    "callback" : function() {
                        hasOutstandingChallenge = false;
                        socket.emit('lobby:challenge:cancel', to);
                    }
                }
            });
        },
        'lobby:game:scorechange': function(data) {
            if ($("#games tr[data-id='"+data.id+"']").length) {
                $("#games tr[data-id='"+data.id+"'] span."+data.player).html(data.score);
            }
        },
        'lobby:chat': function(msg) {
            addChatLine(msg);
        }
    };

})();

socket.emit('lobby:ready');
