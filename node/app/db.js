var mongo   = require('mongodb'),
    client  = null;

console.log("init new db connection");
module.exports = new mongo.Db(
    'socket2m',
    new mongo.Server(
        'localhost',
        mongo.Connection.DEFAULT_PORT,
        {}
    ),
    {}
);
