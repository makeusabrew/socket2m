var GameManager = (function() { 
    var self = this,
        _frame = 0,
        _lastTick = 0,
        _delta = 0,

        _surface = null,

        _player = null,
        _opponent = null,

        _respawns = [];

        _entities = [];

        
    
    self.loop = function() {
        var tickTime = new Date().getTime();
        // we want a delta in *seconds*, to make it easier to scale our values
        _delta = (tickTime - _lastTick) / 1000;

        if (tickTime % 20 == 0) {
            var fps = Math.round(10 / _delta) / 10;
            $("#debug #fps").html(fps+" fps");
        }

        _lastTick = tickTime;

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

                    // hooray! We are. let's do our thing 
                    _entities[i].kill();
                    //self.killPlayer(_opponent.getId());
                } else if (_entities[i].getOwner() == _opponent.getId() &&
                    self.entitiesTouching(_entities[i], _player)) {

                    // ok, kill the bullet, but do nothing else, since the 
                    // player will trigger the server request
                    _entities[i].kill();
                }
            }

            if (_entities[i].isDead()) {
                console.log("found dead entity at index "+i);
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
        console.log("spawning bullet", options);
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

    self.killPlayer = function(id) {
        console.log("requesting kill player "+id);
        // @todo we could omit the ID if we restrict "player"
        // to literally only be the player object (or opponent)
        // in which case the server can infer it...
        socket.emit("game:player:kill", id);
    }

    self.actuallyKillPlayer = function(data) {
        var id = data.id;
        console.log("actually killing player "+id);

        $("#game #p1").html(data.scores[0]);
        $("#game #p2").html(data.scores[1]);

        if (id == _player.getId()) {
            SoundManager.playSound("player:die");
            socket.emit("game:player:respawn");
        } else if (id == _opponent.getId()) {
            SoundManager.playSound("player:kill");
        } else {
            console.log("unknown ID "+id);
        }
    }

    self.actuallyRespawnPlayer = function(player) {
        console.log("queuing respawing player", player);
        // we have to queue the respawn up to ensure it only happens during our tick method
        // as we can't control when this method is fired
        _respawns.push(player);
    }

    self.getCoordinateForPlatform = function(platform) {
        return ((platform+1)*200)-32;
    }

    return self;
})();

function animate() {
    requestAnimFrame(animate);
    GameManager.loop();
}
