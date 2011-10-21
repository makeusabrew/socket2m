var _platforms = 3;

module.exports = {
    getRandomPlatform: function(current) {
        if (current == null) {
            current = -1;
        }
        console.log("avoiding platform "+current);
        var platform;
        do {
            platform = Math.floor(Math.random()*_platforms);
        } while (platform == current);
        return platform;
    }
};
