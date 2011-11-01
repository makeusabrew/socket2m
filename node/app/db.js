var mongo   = require('mongodb'),
    client  = null,
    Config  = require('./config');

console.log("init new db connection to "+Config.getValue("db.name"))
module.exports = new mongo.Db(
    Config.getValue("db.name"),
    new mongo.Server(
        'localhost',
        mongo.Connection.DEFAULT_PORT,
        {}
    ),
    {}
);
