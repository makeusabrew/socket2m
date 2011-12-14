/**
 * N.B the underscores on all the variables indicate those which should be private, but for reasons
 * I haven't quite got to the bottom of, couldn't be - looked like assignment by reference-esque issues
 * one to debug later...
 */
Player = function(options) {
    this._id = options.id,
    this._x = options.x,
    this._y = options.y,
    this._a = options.a
    this._v = options.v,
    this._c = options.c,
    this._username = options.username,
    this._side = options.side,

    this._cWeapon = 0,
    this._weapons = {
        "0" : Weapon.factory(0),
        "1" : Weapon.factory(1)
    },

    this.aim = {
        x: 0,
        y: 0
    },

    this._lastAim = {
        x: -1,
        y: -1
    };

    this._lastX = -1;
    this._lastY = -1;

    this.tick = function() {
        //
    }

    this.getId = function() {
        return this._id;
    }

    /*
    this.preRender = function() {
        gSurface.clearRect(this.aim.x, this.aim.y, 5, 5);
        gSurface.clearRect(this._x | 0, this._y | 0, 16, 32);
    }
    */

    this.render = function() {
        var rx = this._x,
            ry = this._y;

        if (rx != this._lastX || ry != this._lastY) {
            gSurface.clearRect(this._lastX, this._lastY, 16, 32);
            this._lastX = rx;
            this._lastY = ry;
        }

        gSurface.setFillStyle(this._c);
        gSurface.fillRect(this._x, this._y, 16, 32);
    }

    this.renderSight = function() {
        // draw where I'm aiming
        this.aim.x = (this._x + Math.cos((this._a/180)*Math.PI) * this._v) | 0;
        this.aim.y = (this._y + Math.sin((this._a/180)*Math.PI) * this._v) | 0;

        var rx = this.aim.x,
            ry = this.aim.y;

        if (rx != this._lastAim.x || ry != this._lastAim.y) {
            gSurface.clearRect(this._lastAim.x, this._lastAim.y, 5, 5);
            this._lastAim.x = this.aim.x;
            this._lastAim.y = this.aim.y;
        }

        gSurface.setFillStyle("rgb(0, 0, 0)");
        gSurface.square(this.aim.x, this.aim.y, 5);
    }

    this.fireWeapon = function() {
        if (!this.getWeapon().isLoaded()) {
            return;
        }

        // the commented options are now determined server side
        var options = {
            //x: this._x,
            //y: this._y,
            a: this._a,
            v: this._v
            //o: this._id
        };
        this.getWeapon().fire(options);
    }

    this.setReloadTime = function(reload) {
        this.getWeapon().reloadIn(reload);
    }

    this.changeWeapon = function(type) {
        console.log("changing to weapon "+type);
        this._cWeapon = type;
    }

    this.getWeapon = function() {
        return this._weapons[this._cWeapon];
    }

    this.getUsername = function() {
        return this._username;
    }

    this.decreaseAngle = function(delta) {
        this._a -= 50 * delta;
    }

    this.increaseAngle = function(delta) {
        this._a += 50 * delta;
    }

    this.decreaseVelocity = function(delta) {
        this._v -= 60 * delta;
        if (this._v < 25) {
            this._v = 25;
        }
    }

    this.increaseVelocity = function(delta) {
        this._v += 60 * delta;
        if (this._v > 200) {
            this._v = 200;
        }
    }

    this.getLeft = function() {
        return this._x;
    }

    this.getTop = function() {
        return this._y;
    }

    this.getRight = function() {
        return this.getLeft() + 16;
    }

    this.getBottom = function() {
        return this.getTop () + 32;
    }

    this.spawn = function(options) {
        this._x = options.x;
        this._y = options.y;
    }

    this.getSide = function() {
        return this._side;
    }
};

Player.factory = function(options) {
    console.log("Player::factory", options);
    return new Player(options);
};
