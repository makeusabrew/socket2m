Bullet = function() {
    this._x = 0;
    this._y = 0;
    this._alive = false;
    this._owner = 0;
    this._vx = 0;
    this._vy = 0;
    this._w = 0;
    this._id = 0;
    this._t = 0;
    this._sx = 0;
    this._sy = 0;
}

Bullet.prototype = {
    spawn: function(options) {
        this._x = options.x;
        this._y = options.y;
        this._owner = options.o;
        this._id = options.id;
        this._alive = true;
        this._w = 3;

        // bullets no longer infer their own vx / vy, we let the server do it
        this._vx = options.vx;
        this._vy = options.vy;

        this._lastX = -1;
        this._lastY = -1;
        this._t = new Date().getTime();

        this._sx = options.x;
        this._sy = options.y;

    },

    getOwner: function() {
        return this._owner;
    },

    getId: function() {
        return this._id;
    },

    tick: function(tickTime) {
        /*
        this._x += this._vx * delta;
        this._y += this._vy * delta;

        this._vy += 20 * delta;
        */

        var t = (tickTime - this._t) / 1000;
        this._x = (this._vx * t) + this._sx;
        this._y = (this._vy * t + 0.5 * 20.0 * (t*t)) + this._sy;

        if (this.getLeft() < GameManager.getLeft()   ||
            this.getRight() > GameManager.getRight()  ||
            this.getTop() < GameManager.getTop()    ||
            this.getBottom() > GameManager.getBottom()) {
            
            this.kill();
        }
    },

    isDead: function() {
        return !this._alive;
    },

    /*
    preRender: function() {
        gSurface.clearRect(this._x | 0, this._y | 0, this._w, this._w);
    },
    */

    render: function() {
        var rx = this._x | 0,
            ry = this._y | 0;

        if (rx != this._lastX || ry != this._lastY) {
            gSurface.clearRect(this._lastX, this._lastY, this._w, this._w);
            this._lastX = rx;
            this._lastY = ry;
        }
        gSurface.square(rx, ry, this._w);
    },

    kill: function() {
        gSurface.clearRect(this._lastX, this._lastY, this._w, this._w);
        this._alive = false;
    },

    getLeft: function() {
        return this._x;
    },

    getTop: function() {
        return this._y;
    },

    getRight: function() {
        return this.getLeft() + this._w;
    },

    getBottom: function() {
        return this.getTop() + this._w;
    }
};

Bullet.factory = function() {
    return new Bullet();
};

