var GameManager = (function() { 
    var self = {},
        _frame = 0,
        _lastTick = 0,
        _delta = 0,

        _surface = null,

        _player = null,
        _opponent = null,

        _respawns = [],
        _deadEntities = [],

        _entities = [],

        _duration = 0,
        _screenDuration = -1,

        _notifiedOfTimeout = false,

        _gameOver = false,

        _suddenDeath = false,

        _chatting = false;

        
    
    self.loop = function() {
        if (_gameOver) {
            return;
        }

        var tickTime = new Date().getTime();
        // we want a delta in *seconds*, to make it easier to scale our values
        _delta = (tickTime - _lastTick) / 1000;

        if (tickTime % 20 == 0) {
            var fps = Math.round(10 / _delta) / 10;
            $("#debug #fps").html(fps+" fps");
        }

        _lastTick = tickTime;

        if (_suddenDeath) {
            // timer is irrelevant
            // is anything?
        } else {
            // duration tick tick tick
            if (_duration >= 0) {
                _duration -= _delta;
                if (Math.ceil(_duration) != _screenDuration) {
                    _screenDuration = Math.ceil(_duration);
                    $("#countdown").html(Utils.formatTime(_screenDuration));
                }
            } else if (!_notifiedOfTimeout) {
                _notifiedOfTimeout = true;
                socket.emit('game:timeup');
            }
        }

        self.preRender();       // any clean up from the last frame
        self.handleInput();     // process any input which might affect tick
        self.tick();            // think, move, die, etc
        self.render();          // render frame outcome
    }

    self.preRender = function() {
        _player.preRender();
        _opponent.preRender();
        for (var i = 0, j = _entities.length; i < j; i++) {
            _entities[i].preRender();
        }
    }

    self.handleInput = function() {
        // @todo move this into player, possibly a pre-tick section (handleInput?)
        if (_chatting) {
            // all input should be directed at the chat form
            // foo
            return;
        }

        if (Input.isKeyDown("SPACE_BAR")) {
            _player.fireWeapon();
        }

        if (Input.isKeyDown("LEFT_ARROW")) {
            _player.decreaseAngle();
        } else if (Input.isKeyDown("RIGHT_ARROW")) {
            _player.increaseAngle();
        }

        if (Input.isKeyDown("DOWN_ARROW")) {
            _player.decreaseVelocity();
        } else if (Input.isKeyDown("UP_ARROW")) {
            _player.increaseVelocity();
        }
    }

    self.tick = function() {

        for (var i = 0, j = _respawns.length; i < j; i++) {
            var player = _respawns[i];
            var user = player.socket_id == _player.getId() ? _player : _opponent;
            user.spawn({
                "x" : player.x,
                "y" : self.getCoordinateForPlatform(player.platform)
            });
        }
        _respawns = [];

        // ... bleuch.
        for (var i = 0, j = _deadEntities.length; i < j; i++) {
            for (var k = _entities.length-1; k >= 0; k--) {
                if (_entities[k].getId() == _deadEntities[i]) {
                    console.log("killing entity "+_entities[k].getId());
                    _entities[k].kill();
                    _entities.splice(k, 1);
                    break;
                }
            }
        }

        _deadEntities = [];

        // we need a backwards loop to allow for deletion of multiple
        // array indices during each iteration
        // this means it isn't fast - anything we can do? @todo
        for (var i = _entities.length-1; i >= 0; i--) {
            _entities[i].tick(_delta);


            if (!_entities[i].isDead()) {
                // what about players? let's cheat temporarily because
                // we know all entities are bullets, and we also know
                // that all bullets want to do is hit their opponents...
                if (_entities[i].getOwner() == _player.getId() &&
                    self.entitiesTouching(_entities[i], _opponent)) {

                    // we know the bullet should die, so remove it immediately
                    _entities[i].kill();

                    // signal to the server, and the opponent, that they and this bullet should die
                    self.killPlayer(_opponent.getId(), _entities[i].getId());

                } else if (_entities[i].getOwner() == _opponent.getId() &&
                    self.entitiesTouching(_entities[i], _player)) {

                    // ok, kill the bullet, but do nothing else, since the 
                    // player will trigger the server request
                    _entities[i].kill();
                }
            }

            if (_entities[i].isDead()) {
                console.log("found dead entity ID "+_entities[i].getId());
                _entities.splice(i, 1);
            }
        }
    }

    self.render = function() {
        // no longer blatting the entire surface - faster to redraw appropriate sections
        //_surface.clear();
        _player.render();
        _player.renderSight();
        _opponent.render();

        // left platforms
        _surface.fillRect(0, (this.getBottom()/3) * 1, 48, 10, "rgb(0, 0, 0)");
        _surface.fillRect(0, (this.getBottom()/3) * 2, 48, 10, "rgb(0, 0, 0)");

        // right platforms
        _surface.fillRect(this.getRight()-48, (this.getBottom()/3) * 1, 48, 10, "rgb(0, 0, 0)");
        _surface.fillRect(this.getRight()-48, (this.getBottom()/3) * 2, 48, 10, "rgb(0, 0, 0)");

        for (var i = 0, j = _entities.length; i < j; i++) {
            _entities[i].render();
        }
    }

    self.initSurface = function(elem) {
        self.setSurface(new Surface(elem));
    }

    self.setSurface = function(surface) {
        _surface = surface;
    }

    self.setPlayer = function(player) {
        _player = player;
    }

    self.setOpponent = function(opponent) {
        _opponent = opponent;
    }

    self.spawnBullet = function(options) {
        console.log("requesting bullet");
        socket.emit("game:bullet:spawn", options);
    }

    self.actuallySpawnBullet = function(options) {
        console.log("spawning bullet "+options.id, options);
        var bullet = Bullet.factory();
        bullet.spawn(options);
        SoundManager.playSound("weapon:fire");
        _entities.push(bullet);
    }

    self.getSurface = function() {
        return _surface;
    }

    self.getLeft = function() {
        return 0;
    }

    self.getTop = function() {
        return 0;
    }

    self.getBottom = function() {
        return self.getTop() + _surface.getHeight();
    }

    self.getRight = function() {
        return self.getLeft() + _surface.getWidth();
    }

    self.entitiesTouching = function(e1, e2) {
        return (e1.getLeft() <= e2.getRight() &&
                e2.getLeft() <= e1.getRight()  &&
                e1.getTop()  <= e2.getBottom() &&
                e2.getTop()  <= e1.getBottom());
    }

    self.killPlayer = function(id, eId) {
        console.log("requesting kill player "+id+" from bullet "+eId);
        // @todo we could omit the ID if we restrict "player"
        // to literally only be the player object (or opponent)
        // in which case the server can infer it...
        socket.emit("game:player:kill", {
            "id": id,
            "eId": eId
        });
    }

    self.actuallyKillPlayer = function(data) {
        var id = data.id;
        console.log("actually killing player "+id);

        $("#game #p1").html(data.scores[0]);
        $("#game #p2").html(data.scores[1]);

        if (id == _player.getId()) {

            if (data.doRespawn) {
                SoundManager.playSound("player:die");
                socket.emit("game:player:respawn");
            }

            console.log("queuing entity death "+data.eId);
            _deadEntities.push(data.eId);

        } else if (id == _opponent.getId()) {
            if (data.doRespawn) {
                SoundManager.playSound("player:kill");
            }
        } else {
            console.log("unknown ID "+id);
        }
    }

    self.actuallyRespawnPlayer = function(player) {
        console.log("queuing respawning player", player);
        // we have to queue the respawn up to ensure it only happens during our tick method
        // as we can't control when this method is fired
        _respawns.push(player);
    }

    self.getCoordinateForPlatform = function(platform) {
        return ((platform+1)*200)-32;
    }

    self.beginChatting = function() {
        Input.releaseKeys();
        console.log('beginning chat');
        _chatting = true;

        var offset = $("#viewport").offset();

        var form = $(
            "<form id='chatform' style='display:none;'><input type='text' placeholder='type your message' /></form>"
        ).css({
            "left": _player.getLeft() + offset.left - 100,
            "top": _player.getTop() + offset.top - 50
        });

        $("body").append(form);

        $("input", form).blur(function() {
            self.endChatting();
        });

        form.submit(function(e) {
            e.preventDefault();
            var val = $.trim($("input", form).val());
            if (val.length) {
                console.log("chatting: "+val);
                socket.emit('game:player:chat', val);
                self.endChatting();
            }
        });

        //form.fadeIn('normal', function() {
        //    $("input", this).focus();
        //});
        form.show();
        $("input", form).focus();
    }

    self.endChatting = function() {
        Input.bindKeys();
        _chatting = false;
        $("#chatform").fadeOut('fast', function() {
            $(this).remove()
        });
    }

    self.isChatting = function() {
        return _chatting;
    }

    self.showChatMessage = function(data) {
        var offset = $("#viewport").offset();
        var user = _opponent.getId() == data.id ? _opponent : _player;

        var bubble = $(
            "<div class='chatbubble' style='display:none;'>"+data.msg+"</div>"
        );

        bubble.addClass(user.getSide());
        
        $("body").append(bubble);

        // now adjust for the size of the bubble
        bubble.css("top", user.getTop() + offset.top - 40 - bubble.height() / 2);
        if (user.getSide() == "left") {
            bubble.css("left", offset.left + 8);    // 8 is an arbitrary offset
        } else {
            bubble.css("left", offset.left + $("#viewport").width() - bubble.width() - 21);
        }
        bubble.fadeIn('normal', function() {
            setTimeout(function() {
                bubble.fadeOut('normal', function() {
                    bubble.remove();
                });
            }, 3500);
        });
        if (user.getId() == _opponent.getId()) {
            // chat came from them, so sound it out
            SoundManager.playSound("chat");
        }
    }

    self.start = function(duration) {
        _gameOver = false;
        _suddenDeath = false;
        _chatting = false;
        _notifiedOfTimeout = false;
        _screenDuration = -1;
        _duration = duration;
        _lastTick = new Date().getTime();
        _entities = [];
        _respawns = [];
        _deadEntities = [];
    }

    self.handleWin = function(stats) {
        SoundManager.playSound("game:win");
        var points = stats.scores.win == 1 ? "point" : "points";
        var html =
        "<h2>Congratulations - you win!</h2>"+
        "<p>Well done - you beat "+_opponent.getUsername()+" by <strong>"+stats.scores.win+"</strong> "+points+" to <strong>"+stats.scores.lose+"</strong>.</p>"+
        "<h3>Ranking change</h3>"+
        "<p>Your rank has increased to <strong>"+stats.rank+"</strong> (+"+stats.increase+")</p>"+
        "<h3>Tweet all about it</h3>"+
        "<p>Why not let the world know about your victory? Spread the word to find some new people to beat!</p>"+
        tweetButton({
            "text": "I just won a game of Sock it to 'em - why not come and challenge me to a duel?",
            "count": "horizontal"
        });
        self.endGame(html);
    }

    self.handleLose = function(stats) {
        SoundManager.playSound("game:lose");
        var points = stats.scores.win == 1 ? "point" : "points";
        var html =
        "<h2>Oh no - you lose!</h2>"+
        "<p>Bad luck - you lost to "+_opponent.getUsername()+" by <strong>"+stats.scores.win+"</strong> "+points+" to <strong>"+stats.scores.lose+"</strong>.</p>"+
        "<h3>Ranking change</h3>";
        if (stats.decrease) {
            html += "<p>Your rank has decreased to <strong>"+stats.rank+"</strong> (-"+stats.decrease+")</p>";
        } else {
            html += "<p>Your rank has remained unchanged at <strong>"+stats.rank+"</strong></p>";
        }
        html += "<h3>Spread the word</h3>"+
        "<p>Why not challenge someone else? Spread the word to find some new people to beat!</p>"+
        tweetButton({
            "text": "Fancy a duel? Come and have a game of Sock it to em'!",
            "count": "horizontal"
        });
        self.endGame(html);
    }

    self.cancelGame = function(str) {
        self.endGame(str);
    }

    self.endGame = function(str, emit) {
        cancelRequestAnimFrame(animFrame);
        _gameOver = true;
        Input.releaseKeys();
        $("#countdown").html("Game Over");
        mbalert(str, function() {
            socket.emit('game:finish');
        });
    }

    self.setSuddenDeath = function() {
        _suddenDeath = true;
        SoundManager.playSound("game:suddendeath");
        // in case we were still rounding up to 0:01
        $("#countdown").html("Sudden Death");
    }

    self.bindKeys = function() {
        Input.captureKeys([
            'SPACE_BAR',
            'UP_ARROW',
            'DOWN_ARROW',
            'LEFT_ARROW',
            'RIGHT_ARROW'
        ]);

        Input.bindTo(window);

        Input.bindKeys();

        Input.onKeyPress('T', function(e) {
            if (!self.isChatting()) {
                self.beginChatting();
            }
        });

        Input.onKeyPress('ESC', function(e) {
            if (self.isChatting()) {
                self.endChatting();
            }
        });
    }

    return self;
})();

var animFrame = null;

function tick() {
    animFrame = requestAnimFrame(tick);
    GameManager.loop();
}
