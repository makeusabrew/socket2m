var LobbyManager = (function() {
    var self = {};

    // we'll keep a copy of the player's user object
    var user = null;
    var serverTime = null;
    var gameHandlers = {};
    var hasOutstandingChallenge = false;
    var titleHandler = null;
    var oldTitle = null;

    function addUser(_user) {
        if ($("td[data-id='"+_user.sid+"']").length) {
            console.warn("Not adding user ID "+_user.sid+" to table - already present");
            return;
        }

        var _class = (_user.sid == user.sid) ? "me" : "opponent";
        var profileText = (_user.sid == user.sid) ? "your" : ""+_user.username+'\'s';

        if (_user.rank == null) {
            _user.rank = 0;
        }
        if (_user.wins == null) {
            _user.wins = 0;
        }
        if (_user.losses == null) {
            _user.losses = 0;
        }
        return $(
            "<tr>"+
            "<td data-id='"+_user.sid+"' "+
            "data-username='"+_user.username+"' "+
            "data-rank='"+_user.rank+"' "+
            "class='"+_class+"'>"+_user.username+" "+
            "<a title=\"View "+profileText+" profile in a new window\" href='/user/"+_user.username+"' target='_blank'><img src='/img/profile.png' alt='View "+_user.username+"\'s profile' /></a>"+
            "<td>"+_user.rank+"</td>"+
            "<td>"+_user.wins+"</td>"+
            "<td>"+_user.losses+"</td>"+
            "</tr>"
        );
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
                    bootbox.alert("You've got a challenge outstanding - please wait.");
                } else {
                    var stakeBlurb = getStakes(user, {"rank":elem.data('rank')});
                    var html = "<p>Do you want to challenge <strong>"+elem.data('username')+"</strong>? "+
                    stakeBlurb+
                    "<h4 class='challenge'>Issue the challenge?</h4>";
                    bootbox.confirm(html, function(result) {
                        // boom!
                        if (result) {
                            hasOutstandingChallenge = true;
                            console.log("issuing challenge to "+targetId);
                            socket.emit('lobby:challenge:issue', targetId);
                        }
                    }, "Yes", "No");
                }
            }
        });
    }

    self.addChatLine = function(msg) {
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

    self.init = function(data) {
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
           self.addChatLine(data.chatlines[i]); 
        }

        bindListeners();
    }

    self.addUser = function(user) {
        console.log("user joining lobby", user);
        var u = addUser(user);
        if (u) {
            $("#users table tbody").append(u);
            // put the hide *after* DOM insertion to fix FF issues
            u.hide();
            u.fadeIn('slow');
            
            // well, if anyone else joined, obviously we're not alone
            $("#tweet-challengers").hide();
        }

        bindListeners();
    }

    self.removeUser = function(id) {
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
    }

    self.addGame = function(game) {
        console.log("game starting", game);
        serverTime = new Date(game.started);
        var g = addGame(game);
        $("#games table tr.placeholder").remove();
        $("#games table tbody").append(g);
        g.hide();
        g.fadeIn('slow');
    }

    self.removeGame = function(id) {
        console.log('received game end for ID '+id);
        clearInterval(gameHandlers[id]);
        $("#games table tr[data-id='"+id+"']").fadeOut('slow', function() {
            $(this).remove();
            if ($("#games table tbody tr").length == 0) {
                $("#games table tbody").append("<tr class='placeholder'><td>-</td><td>-</td><td>-</td></tr>");
            }
        });
    }

    self.updateGameScore = function(data) {
        if ($("#games tr[data-id='"+data.id+"']").length) {
            $("#games tr[data-id='"+data.id+"'] span."+data.player).html(data.score);
        }
    }

    self.receiveChallenge = function(from) {
        oldTitle = $("title").html();
        var titles = [
            "Incoming challenge!",
            oldTitle
        ];
        var cTitle = 0;
        $("title").html(titles[cTitle]);
        titleHandler = setInterval(function() {
            if (++cTitle >= titles.length) {
                cTitle = 0;
            }
            $("title").html(titles[cTitle]);
        }, 2000);
            
        var stakeBlurb = getStakes(user, from);
        var html = 
        "<h2>Incoming challenge!</h2>"+
        "<p>You've received a challenge from <strong>"+from.username+"</strong>. "+
        stakeBlurb+
        "<h4 class='challenge'>Accept the challenge?</h4>";

        bootbox.confirm(html, function(result) {
            clearInterval(titleHandler);
            $("title").html(oldTitle);
            socket.emit('lobby:challenge:respond', result);
        }, "Yes", "No");
    }

    self.challengeResponse = function(data) {
        hasOutstandingChallenge = false;
        // hide any other modals
        $(".modal").modal("hide");
        if (data.accepted) {
            console.log("requesting game start...");
            socket.emit('lobby:startgame');
        } else if (data.to != user.sid) {
            bootbox.alert("The opponent declined your challenge.");
        }
    }

    self.challengeBlocked = function() {
        hasOutstandingChallenge = false;
        bootbox.alert("Sorry, this user has just challenged (or been challenged by) someone else. Try again in a moment.");
    }

    self.cancelChallenge = function() {
        // user cancelled their challenge against us
        // presumably we've got a modal in our face, so get rid
        clearInterval(titleHandler);
        $("title").html(oldTitle);
        $(".modal").modal("hide");
        bootbox.alert("The opponent withdrew their challenge.");
    }

    self.couldNotCancelChallenge = function() {
        console.log("could not cancel challenge");
        // do we care? we tried to cancel but couldn't. so what?
    }

    self.confirmChallenge = function(to) {
        bootbox.dialog(
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
    }

    return self;
})();
