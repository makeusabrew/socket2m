var GameManager = (function() { 
    var self = {},
        _frame = 0,
        _lastTick = 0,
        _lastFps = 0,
        _delta = 0,

        _surface = null,

        _player = null,
        _opponent = null,

        _respawns = [],
        _deadEntities = [],
        _deadPowerups = [],

        _entities = [],
        _powerups = [],

        _platforms = [],

        _duration = 0,
        _screenDuration = -1,

        _notifiedOfTimeout = false,
        _timeupHandler = null,

        _gameOver = false,

        _suddenDeath = false,

        _killPending = false,

        _chatting = false,

        /* dom optimisations */
        _fpsElem = null,
        _countDownElem = null;

        
    
    self.loop = function() {
        if (_gameOver) {
            return;
        }

        var tickTime = new Date().getTime();
        // we want a delta in *seconds*, to make it easier to scale our values
        _delta = (tickTime - _lastTick) / 1000;

        if (tickTime >= _lastFps + 1000) {
            _lastFps = tickTime;
            var fps = Math.round(10 / _delta) / 10;
            //$("#debug #fps").html(fps+" fps");
            _fpsElem.innerHTML = fps+" fps";
        }

        _lastTick = tickTime;

        if (_suddenDeath) {
            // timer is irrelevant
            // is anything?
        } else {
            // duration tick tick tick
            if (_duration > 0) {
                _duration -= _delta;
                // @todo can we avoid calling Math.ceil every frame?
                if (Math.ceil(_duration) != _screenDuration) {
                    _screenDuration = Math.ceil(_duration);
                    _countDownElem.innerHTML = Utils.formatTime(_screenDuration);
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
        var i = _entities.length;
        while (i--) {
            _entities[i].preRender();
        }
        i = _powerups.length;
        while (i--) {
            _powerups[i].preRender();
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
            _player.decreaseAngle(_delta);
        } else if (Input.isKeyDown("RIGHT_ARROW")) {
            _player.increaseAngle(_delta);
        }

        if (Input.isKeyDown("DOWN_ARROW")) {
            _player.decreaseVelocity(_delta);
        } else if (Input.isKeyDown("UP_ARROW")) {
            _player.increaseVelocity(_delta);
        }
    }

    self.tick = function() {

        // hello, time for a powerup?
        if (_powerups.length < 3 && Math.floor(Math.random() *2501) == 0) {
            self.spawnPowerup();
        }

        var i = _respawns.length;
        var j;
        if (i) {
            while (i--) {
                var player = _respawns[i];
                var user = player.socket_id == _player.getId() ? _player : _opponent;
                user.spawn({
                    "x" : player.x,
                    "y" : self.getCoordinateForPlatform(player.platform)
                });
                if (user.getId() == _opponent.getId()) {
                    // it's our opponent, so clear our pending kill flag
                    _killPending = false;
                }
                _respawns = [];
            }
        }

        // ... bleuch.
        i = _deadEntities.length;
        if (i) {
            j = _entities.length;
            // loop back through our dead entities array
            while (i--) {
                // and loop back through our actually entities trying to match it
                while (j--) {
                    // if this is the entity to kill, get rid of it and decrement the entity count
                    if (_entities[j].getId() == _deadEntities[i]) {
                        console.log("killing entity "+_entities[j].getId());
                        _entities[j].kill();
                        _entities.splice(j, 1);
                        break;
                    }
                }
            }
            _deadEntities = [];
        }

        // ... more bleuch.
        i = _deadPowerups.length;
        if (i) {
            j = _powerups.length;
            while (i--) {
                while (j--) {
                    if (_powerups[j].getId() == _deadPowerups[i]) {
                        console.log("killing powerup "+_powerups[j].getId());
                        _powerups[j].kill();
                        _powerups.splice(j, 1);
                        break;
                    }
                }
            }
            _deadPowerups = [];
        }

        // we need a backwards loop to allow for deletion of multiple
        // array indices during each iteration
        // this means it isn't fast - anything we can do? @todo
        i = _entities.length;
        while (i--) {
            _entities[i].tick(_delta);

            // check the entity didn't die during its tick method
            if (!_entities[i].isDead()) {
                // what about players? let's cheat temporarily because
                // we know all entities are bullets, and we also know
                // that all bullets want to do is hit their opponents and platforms...
                if (_killPending == false &&
                    _entities[i].getOwner() == _player.getId() &&
                    self.entitiesTouching(_entities[i], _opponent)) {

                    _killPending = true;

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

                if (!_entities[i].isDead()) {
                    // powerups?
                    j = _powerups.length;
                    while (j--) {
                        // theoretically this could be awkward if both player's bullets hit the powerup at the same time...
                        // but we'll worry about that later
                        if (_entities[i].getOwner() == _player.getId() &&
                            self.entitiesTouching(_entities[i], _powerups[j])) {

                            // we know the bullet should die, so remove it immediately
                            _entities[i].kill();
                            //_powerups[j].kill();

                            // grab it and remove powerup
                            self.claimPowerup(_powerups[j].getId(), _entities[i].getId());

                        } else if (_entities[i].getOwner() == _opponent.getId() &&
                            self.entitiesTouching(_entities[i], _powerups[j])) {

                            _entities[i].kill();
                            //_powerups[j].kill();
                        }

                        if (_powerups[j].isDead()) {
                            //console.log("found dead powerup ID "+_powerups[j].getId());
                            //_powerups.splice(j, 1);
                        }
                    }
                }
                        
                // right, now check if we've hit a platform. we don't need to bother
                // the server with this (for now...)
                if (!_entities[i].isDead()) {
                    var j = 4; // hard code the platforms for performance reasons
                    while (j--) {
                        if (self.entitiesTouching(_entities[i], _platforms[j])) {
                            // ok, bye!
                            _entities[i].kill();
                            break;
                        }
                    }
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

        var i = 0;

        i = _platforms.length;
        while (i--) {
            _platforms[i].render();
        }

        i = _entities.length;
        while (i--) {
            _entities[i].render();
        }

        i = _powerups.length;
        while (i--) {
            _powerups[i].render();
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

    /*
    self.spawnBullet = function(options) {
        //console.log("requesting bullet", options);
        socket.emit("game:bullet:spawn", options);
    }
    */

    /*
    self.actuallySpawnBullet = function(options) {
        // @todo improve this - it's a bit daft asking the server
        // for a platform and then converting... I think
        options.y = self.getCoordinateForPlatform(options.platform);
        //console.log("spawning bullet "+options.id, options);
        var bullet = Bullet.factory();
        bullet.spawn(options);
        SoundManager.playSound("weapon:fire");
        _entities.push(bullet);
    }
    */

    self.spawnPowerup = function() {
        socket.emit("game:powerup:spawn");
    }

    self.actuallySpawnPowerup = function(options) {
        console.log("spawning powerup", options);
        var powerup = Powerup.factory();
        powerup.spawn(options);
        _powerups.push(powerup);
        SoundManager.playSound("game:powerup:spawn");
    }

    self.fireWeapon = function(options) {
        socket.emit("game:weapon:fire", options);
    }

    self.actuallyFireWeapon = function(options) {
        // @todo improve this - it's a bit daft asking the server
        // for a platform and then converting... I think
        var x = options.x;
        var o = options.o;
        var y = self.getCoordinateForPlatform(options.platform);

        if (options.o == _player.getId()) {
            _player.setReloadTime(options.reloadIn);
        }

        for (var i = 0, j = options.bullets.length; i < j; i++) {
            var bullet = Bullet.factory();
            var opts = options.bullets[i];
            opts.o = o;
            opts.x = x;
            opts.y = y;

            bullet.spawn(opts);
            _entities.push(bullet);
        }
        SoundManager.playSound("weapon:fire");

    }

    self.reloadPlayerWeaponIn = function(msec) {
        _player.setReloadTime(msec);
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

    self.claimPowerup = function(id, eId) {
        console.log("requesting claim powerup "+id+" from bullet "+eId);
        socket.emit("game:powerup:claim", {
            "id" : id,
            "eId": eId
        });
    }

    self.actuallyClaimPowerup = function(data) {
        console.log("killing bullet " +data.eId+" and queueing powerup removal "+data.id);
        _deadPowerups.push(data.id);
        _deadEntities.push(data.eId);
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

    self.actuallyRespawnPlayer = function(options) {
        console.log("queuing respawning player", options.player);
        // we have to queue the respawn up to ensure it only happens during our tick method
        // as we can't control when this method is fired
        _respawns.push(options.player);
        if (options.teleport) {
            SoundManager.playSound("player:teleport");
        }
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
            "<form id='chatform' style='display:none;'><input type='text' placeholder='type your message' autocomplete='off' /></form>"
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

    self.prepare = function(data) {
        // set up
        var challenger = data.challenger;
        var challengee = data.challengee;
        $("#state-title").html("Game On: "+challenger.username+" Vs "+challengee.username);
        $("#game .stats").html("0");

        self.bindKeys();


        var p1 = Player.factory({
            "id": challenger.socket_id,
            "x" : challenger.x,
            "y" : self.getCoordinateForPlatform(challenger.platform),
            "a" : challenger.a,
            "v" : challenger.v,
            "c" : "rgb(0, 255, 0)",
            "side": "left",
            "username" : challenger.username
        });
        var p2 = Player.factory({
            "id": challengee.socket_id,
            "x" : challengee.x,
            "y" : self.getCoordinateForPlatform(challengee.platform),
            "a" : challengee.a,
            "v" : challengee.v,
            "c" : "rgb(0, 0, 255)",
            "side": "right",
            "username" : challengee.username
        });

        if (challenger.socket_id == data.user.sid) {
            // we're "player 1" - face right
            self.setPlayer(p1);
            self.setOpponent(p2);
        } else {
            // we're p2 so... well, you get it
            self.setPlayer(p2);
            self.setOpponent(p1);
        }

        // bind any canvas rendering to #viewport
        self.initSurface("viewport");

        self.addPlatforms();

        _killPending = false;
        _gameOver = false;
        _suddenDeath = false;
        _chatting = false;
        _notifiedOfTimeout = false;
        _screenDuration = -1;
        _duration = data.duration;
        _entities = [];
        // we don't need to reset platforms
        //_platforms = [];
        _powerups = [];
        _respawns = [];
        _deadEntities = [];
        _deadPowerups = [];

        if (Client.isTouchDevice()) {
            // @todo hide stuff with media queries
            $(".topbar").hide();
            $("#footer").hide();

            $("#touchControls").show();

            document.getElementById("left").ontouchstart = function() {
                Input.keyDown("LEFT_ARROW");
            };
            document.getElementById("left").ontouchend = function() {
                Input.keyUp("LEFT_ARROW");
            };
            document.getElementById("right").ontouchstart = function() {
                Input.keyDown("RIGHT_ARROW");
            };
            document.getElementById("right").ontouchend = function() {
                Input.keyUp("RIGHT_ARROW");
            };
            document.getElementById("up").ontouchstart = function() {
                Input.keyDown("UP_ARROW");
            };
            document.getElementById("up").ontouchend = function() {
                Input.keyUp("UP_ARROW");
            };
            document.getElementById("down").ontouchstart = function() {
                Input.keyDown("DOWN_ARROW");
            };
            document.getElementById("down").ontouchend = function() {
                Input.keyUp("DOWN_ARROW");
            };
            document.getElementById("space").ontouchstart = function() {
                Input.keyDown("SPACE_BAR");
            };
            document.getElementById("space").ontouchend = function() {
                Input.keyUp("SPACE_BAR");
            };
        }

        /* dom elems, for pure speed */
        _fpsElem       = document.getElementById("fps");
        _countDownElem = document.getElementById("countdown");

        socket.emit('game:prepared');

    }

    self.start = function(socket) {
        // save the delta calculation til the last possible moment
        _lastTick = new Date().getTime();
        _lastFps = _lastTick;
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
        "<p>Why not let the world know about your victory? Tweet and find some new people to beat!</p>"+
        tweetButton({
            "text": "I just won a game of Sock it to 'em - why not come and challenge me to a duel?",
            "count": "none"
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
            "count": "none"
        });
        self.endGame(html);
    }

    self.cancelGame = function(options) {
        var html = 
        "<h2>Game aborted!</h2>"+
        "<p>Oh no - "+_opponent.getUsername()+" left the game! ";

        if (options.defaulted) {
            html +=
            "As it was underway, they have <strong>forfeited</strong> it. You don't get "+
            "the glory of a win, but your rank has increased by <strong>one</strong> point, and "+
            "theirs has decreased due to bailing out of your duel.</p>";
        } else {
            html +=
            "As it hadn't got properly underway it has been <strong>cancelled</strong>.</p>";
        }
        self.endGame(html);
    }

    self.endGame = function(str, emit) {
        clearTimeout(_timeupHandler);
        cancelRequestAnimFrame(animFrame);
        _gameOver = true;
        Input.releaseKeys();
        $("#countdown").html("Game Over");
        mbalert(str, function() {
            socket.emit('game:finish');
        });
        if (Client.isTouchDevice()) {
            $(".topbar").show();
            $("#footer").show();
        }
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

    self.addPlatforms = function() {
        // left platforms
        _platforms[0] = new Platform();
        _platforms[0].setCoordinates(0, (this.getBottom()/3) * 1, 48, 10);

        _platforms[1] = new Platform();
        _platforms[1].setCoordinates(0, (this.getBottom()/3) * 2, 48, 10);

        // right platforms
        _platforms[2] = new Platform();
        _platforms[2].setCoordinates(this.getRight()-48, (this.getBottom()/3) * 1, 48, 10);

        _platforms[3] = new Platform();
        _platforms[3].setCoordinates(this.getRight()-48, (this.getBottom()/3) * 2, 48, 10);
    }

    self.changePlayerWeapon = function(type) {
        SoundManager.playSound("weapon:change");
        _player.changeWeapon(type);
    }

    self.delayTimeup = function(wait) {
        // the server has told us our timeup signal was too early - wait
        console.log("retrying timeup in "+wait);
        _timeupHandler = setTimeout(function() {
            console.log("retrying timeup...");
            socket.emit('game:timeup');
        }, wait);
    }

    return self;
})();

var animFrame = null;

function tick() {
    animFrame = requestAnimFrame(tick);
    GameManager.loop();
}
