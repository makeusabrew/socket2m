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

    this._cWeapon = 0,
    this._weapons = {
            "0" : Weapon.factory()
        };


    this.tick = function() {
        //
    }

    this.render = function() {
        var buffer = GameManager.getBuffer();

        // draw me (aka: a rectangle)
        buffer.fillRect(this._x, this._y, 16, 32, this._c);

        // draw where I'm aiming
        var aimX = this._x + Math.cos((this._a/180)*Math.PI) * this._v;
        var aimY = this._y + Math.sin((this._a/180)*Math.PI) * this._v;

        buffer.square(aimX, aimY, 5, "rgb(0, 0, 0)");
    }

    this.fireWeapon = function() {
        if (!this.getWeapon().isLoaded()) {
            return;
        }
        var options = {
            x: this._x,
            y: this._y,
            a: this._a,
            v: this._v,
            o: this._id
        };
        this.getWeapon().fire(options);
    }

    this.getWeapon = function() {
        return this._weapons[this._cWeapon];
    }

    this.getUsername = function() {
        return this._username;
    }

    this.decreaseAngle = function() {
        this._a --;
    }

    this.increaseAngle = function() {
        this._a ++;
    }

    this.decreaseVelocity = function() {
        this._v --;
    }

    this.increaseVelocity = function() {
        this._v ++;
    }
};

Player.factory = function(options) {
    console.log("Player::factory", options);
    return new Player(options);
};
