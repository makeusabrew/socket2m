var spawn = require('child_process').spawn;
var Config = require(__dirname+"/../../app/config");

var Fixtures = {
    import: function(path, cb) {
        spawn('mongo', [Config.getValue('db.name'), path]).on('exit', function(code) {
            cb(code);
        });
    }
};

module.exports = Fixtures;
