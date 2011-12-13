Bullet = function() {
    this._x = 0;
    this._y = 0;
    this._alive = false;
    this._owner = 0;
    this._vx = 0;
    this._vy = 0;
    this._w = 0;
    this._id = 0;
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

    },

    getOwner: function() {
        return this._owner;
    },

    getId: function() {
        return this._id;
    },

    tick: function(delta) {
        this._x += this._vx * delta;
        this._y += this._vy * delta;

        this._vy += 20 * delta;

        if (this._x < GameManager.getLeft()   ||
            this._x > GameManager.getRight()  ||
            this._y < GameManager.getTop()    ||
            this._y > GameManager.getBottom()) {
            
            this._alive = false;
        }
    },

    isDead: function() {
        return !this._alive;
    },

    preRender: function() {
        gSurface.clearRect(this._x | 0, this._y | 0, this._w, this._w);
    },

    render: function() {
        gSurface.square(this._x | 0, this._y | 0, this._w);
    },

    kill: function() {
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
        return this.getTop () + this._w;
    }
};

Bullet.factory = function() {
    return new Bullet();
};

