Bullet = function() {
    var _x,
        _y,
        _a,
        _v,
        _alive;

    this.spawn = function(options) {
        _x = options.x;
        _y = options.y;
        _a = options.a;
        _v = options.v;
        _alive = true;
    }

    this.tick = function() {
        _x += Math.cos((_a/180)*Math.PI) * _v;
        _y += Math.sin((_a/180)*Math.PI) * _v;
    }

    this.render = function() {
        var buffer = GameManager.getBuffer();
        buffer.square(_x, _y, 2, "rgb(255, 0, 0)");
    }
};

Bullet.factory = function() {
    return new Bullet();
};
