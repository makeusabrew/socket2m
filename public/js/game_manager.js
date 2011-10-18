var GameManager = (function() { 
    var self = this,
        _frame = 0,
        _lastTick = 0,
        _delta = 0,

        _buffer = null,

        _player = null,
        _opponent = null,

        _entities = [];

    self.tick = function() {
        var tickTime = new Date().getTime();
        // we want a delta in *seconds*, to make it easier to scale our values
        _delta = (tickTime - _lastTick) / 1000;
        _lastTick = tickTime;

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

        // we need a backwards loop to allow for deletion of multiple
        // array indices during each iteration
        // this means it isn't fast - anything we can do? @todo
        for (var i = _entities.length-1; i >= 0; i--) {
            _entities[i].tick(_delta);

            if (_entities[i].isDead()) {
                console.log("found dead entity index "+i);
                _entities.splice(i, 1);
            }
        }
    }

    self.render = function() {
        _buffer.clear();
        _player.render();
        _player.renderSight();
        _opponent.render();
        for (var i = 0, j = _entities.length; i < j; i++) {
            _entities[i].render();
        }
    }

    self.initBuffer = function(elem) {
        self.setBuffer(new Surface(elem));
    }

    self.setBuffer = function(buffer) {
        _buffer = buffer;
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
        _entities.push(bullet);
    }

    self.getBuffer = function() {
        return _buffer;
    }

    self.getLeft = function() {
        return 0;
    }

    self.getTop = function() {
        return 0;
    }

    self.getBottom = function() {
        return self.getTop() + _buffer.getHeight();
    }

    self.getRight = function() {
        return self.getLeft() + _buffer.getWidth();
    }

    return self;
})();

function animate() {
    requestAnimFrame(animate);
    GameManager.tick();
    GameManager.render();
}
