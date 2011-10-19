Bullet = function() {
    var _x,
        _y,
        _ox,
        _oy,
        _a,
        _v,
        _alive,
        _owner,
        _vx,
        _vy;

    this.spawn = function(options) {
        _x = options.x;
        _y = options.y;
        _a = options.a;
        _v = options.v;
        _owner = options.o;
        _alive = true;

        _vx = Math.cos((_a/180)*Math.PI) * _v;
        _vy = Math.sin((_a/180)*Math.PI) * _v;
    }

    this.tick = function(delta) {
        _x += _vx * delta;
        _y += _vy * delta;

        _vy += 20 * delta;

        if (_x < GameManager.getLeft()   ||
            _x > GameManager.getRight()  ||
            _y < GameManager.getTop()    ||
            _y > GameManager.getBottom()) {
            
            _alive = false;
        }

    }

    this.isDead = function() {
        return !_alive;
    }

    this.render = function() {
        var buffer = GameManager.getSurface();
        buffer.clearRect(_ox, _oy, 3, 3);
        _ox = _x | 0;
        _oy = _y | 0;
        buffer.square(_ox, _oy, 3, "rgb(255, 0, 0)");
    }
};

Bullet.factory = function() {
    return new Bullet();
};
