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
        _delta = (tickTime - _lastTick) / 1000;
        _lastTick = tickTime;

        if (Input.isKeyDown("SPACE_BAR")) {
            _player.fireWeapon();
        }

        var removed = false;
        for (var i = 0, j = _entities.length; i < j; i++) {
            _entities[i].tick(_delta);

            if (_entities[i].isDead()) {
                console.log("found dead entity index "+i);

                // delete to preserve indices
                removed = true;
                delete _entities[i];
            }
        }

        if (removed) {
            // reshuffle indices
            _entities.splice(0, 0);
        }
    }

    self.render = function() {
        _buffer.clear();
        _player.render();
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
