Player = function(options) {
    var _id = options.id,
        _x = options.x,
        _y = options.y,
        _a = options.a
        _v = options.v,
        _c = options.c,
        _username = options.username,

        _cWeapon = 0,
        _weapons = {
            "0" : Weapon.factory()
        };


    this.tick = function() {
        //
    }

    this.render = function() {
        GameManager.getBuffer().fillRect(_x, _y, 16, 32, _c);
    }

    this.fireWeapon = function() {
        if (!this.getWeapon().isLoaded()) {
            return;
        }
        var options = {
            x: _x,
            y: _y,
            a: _a,
            v: _v
        };
        this.getWeapon().fire(options);
    }

    this.getWeapon = function() {
        return _weapons[_cWeapon];
    }
};

Player.factory = function(options) {
    return new Player(options);
};
