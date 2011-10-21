var _platforms = 3;

module.exports = {
    getRandomPlatform: function() {
        return Math.floor(Math.random()*_platforms);
    }
};
