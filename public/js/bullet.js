Bullet = function() {
    var _x,
        _y,
        _a,
        _v,
        _alive,
        _owner,
        _vx,
        _vy,
        _w;

    this.spawn = function(options) {
        _x = options.x;
        _y = options.y;
        _a = options.a;
        _v = options.v;
        _owner = options.o;
        _id = options.id;
        _alive = true;
        _w = 3;

        _vx = Math.cos((_a/180)*Math.PI) * _v;
        _vy = Math.sin((_a/180)*Math.PI) * _v;
    }

    this.getOwner = function() {
        return _owner;
    }

    this.getId = function() {
        return _id;
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

    this.preRender = function() {
        var buffer = GameManager.getSurface();
        buffer.clearRect(_x | 0, _y | 0, _w, _w);
    }

    this.render = function() {
        var buffer = GameManager.getSurface();
        buffer.square(_x | 0, _y | 0, _w, "rgb(255, 0, 0)");
    }

    this.kill = function() {
        _alive = false;
    }

    this.getLeft = function() {
        return _x;
    }

    this.getTop = function() {
        return _y;
    }

    this.getRight = function() {
        return this.getLeft() + _w;
    }

    this.getBottom = function() {
        return this.getTop () + _w;
    }
};

Bullet.factory = function() {
    return new Bullet();
};
