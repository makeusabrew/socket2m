#!/usr/local/bin/node

var db = require('./app/db');
db.open(function(err, client) {
    if (err) {
        console.log(err);
        throw err;
    }

    // in case this script takes aaaaaaaaaaaages, cache the date
    var updateDate = new Date();

    console.log("Updating daily rankings...");
    db.collection('users', function(err, collection) {
        collection
        .find()
        .each(function(err, doc) {
            if (doc == null) {
                console.log("done");
                process.exit(0);
            }
            db.collection('daily_rankings', function(err, collection) {
                var stats = [{
                    date: updateDate,
                    rank: doc.rank || 0,
                    wins: doc.wins || 0,
                    losses: doc.losses || 0,
                    kills: doc.kills || 0,
                    defaults: doc.defaults || 0
                }];
                collection
                .update({user_id: doc._id}, {$push: {"stats": stats}}, {upsert:true});
            });
        });
    });

});

