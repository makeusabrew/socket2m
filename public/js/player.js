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
        GameManager.getBuffer().fillRect(this._x, this._y, 16, 32, this._c);
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
};

Player.factory = function(options) {
    console.log("P opts", options);
    return new Player(options);
};
