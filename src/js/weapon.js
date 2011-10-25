Weapon = function() {
    var _loaded = true,
        _reloadAt = new Date().getTime(),
        _type = 0;

    this.isLoaded = function() {
        // save ourself some maths if we don't have to
        if (_loaded) {
            return true;
        }

        if (_reloadAt == false) {
            return false;
        }

        // otherwise, work it out
        var now = new Date().getTime();
        _loaded = (now >= _reloadAt);

        return _loaded;
    }

    this.fire = function(options) {
        //GameManager.spawnBullet(options);
        options.type = _type;
        GameManager.fireWeapon(options);
        _loaded = false;
        _reloadAt = false;
    };

    this.reloadIn = function(reloadIn) {
        _reloadAt = new Date().getTime() + reloadIn;
    }

    this.setType = function(type) {
        _type = type;
    }
};

Weapon.factory = function(type) {
    var w = new Weapon();
    w.setType(type);
    return w;
};
