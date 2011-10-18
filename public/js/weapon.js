Weapon = function() {
    var _rof = 1000,
        _loaded = true,
        _reloadHandler = null;

    this.isLoaded = function() {
        return _loaded;
    }

    this.fire = function(options) {
        GameManager.spawnBullet(options);
        _loaded = false;
        _reloadHandler = setTimeout(function() {
            _loaded = true;
        }, _rof);
    };
};

Weapon.factory = function() {
    return new Weapon();
};
