#!/usr/local/bin/node

var db = require('../app/db');
db.open(function(err, client) {
    if (err) {
        console.log(err);
        throw err;
    }

    // in case this script takes aaaaaaaaaaaages, cache the date
    var updateDate = new Date();
    var position = 1;

    console.log("Updating user positions...");
    db.collection('users', function(err, collection) {
        collection
        .find()
        /*.limit(100)*/
        .sort({rank: -1, wins: -1, losses: 1, kills: -1})
        /*
        .toArray(function(err, docs) {
            var players = [];
            res.render('top-users', {
                'pageTitle': 'Top 100 Players',
                users: docs,
                "settings": settings
            });
        });
        */
        .each(function(err, doc) {
            if (doc == null) {
                console.log("done");
                process.exit(0);
            }
            //db.collection('users', function(err, collection) {
            collection.update({_id: doc._id},   {$set: {position: position}});
            position ++;
                //collection.update({_id: loser._id}, {$set: lUpdate});
            //});
        });
    });
});
