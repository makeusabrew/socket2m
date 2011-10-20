Weapon = function() {
    var _rof = 1000,
        _loaded = true,
        _firedAt = new Date().getTime();

    this.isLoaded = function() {
        // save ourself some maths if we don't have to
        if (_loaded) {
            return true;
        }

        // otherwise, work it out
        var now = new Date().getTime();
        _loaded = (now >= _firedAt + _rof);

        return _loaded;
    }

    this.fire = function(options) {
        GameManager.spawnBullet(options);
        _loaded = false;
        _firedAt = new Date().getTime();
    };
};

Weapon.factory = function() {
    return new Weapon();
};
