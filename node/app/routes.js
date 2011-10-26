var utils   = require('./shared/utils');
var db      = require('./db');

module.exports = function(app) {
    /**
     * Home Page
     */
    app.get('/', function(req, res) {
        res.render('index');
    });

    /**
     * About Page 
     */
    app.get('/about', function(req, res) {
        res.render('about', {
            'pageTitle': 'About'
        });
    });

    /**
     * Top 100 users
     */
    app.get('/users/top', function(req, res) {
        db.collection('users', function(err, collection) {
            collection
            .find()
            .limit(100)
            .sort({rank: -1})
            .toArray(function(err, docs) {
                var players = [];
                res.render('top-users', {
                    'pageTitle': 'Top 100 Players',
                    users: docs
                });
            });
        });
    });

    /**
     * User profile page
     */
    app.get(/\/user\/([A-z0-9_]+)/, function(req, res) {
        var username = req.params[0];
        db.collection('users', function(err, collection) {
            collection.findOne({"username": username}, function(err, user) {
                if (user == null) {
                    res.send("Invalid user");
                    return;
                }
                if (!user.shots) {
                    user.accuracy = 0;
                } else {
                    var hits = user.hits || 0;
                    user.accuracy = Math.round((hits / user.shots)*100);
                }
                db.collection('games', function(err, collection) {
                    collection
                    .find({isFinished: true, $or : [{"challenger.db_id": user._id}, {"challengee.db_id": user._id}]})
                    .limit(6)
                    .sort({started: -1})
                    .toArray(function(err, docs) {

                        var games = [];
                        docs.forEach(function(game) {
                            // we could probably do this far more efficiently, but we need to
                            // augment the game objects before rendering them

                            game.elapsed = utils.formatTime(
                                Math.round((game.finished - game.started) / 1000)
                            );

                            var outcome = "";
                            if (game.defaulted) {
                                var defaulter = game.defaulter.toString() == game.challenger.db_id.toString() ?
                                    game.challenger :
                                    game.challengee;

                                outcome = "Forfeited by "+defaulter.username;
                            } else if (game.cancelled) {
                                outcome = "Cancelled";
                            } else {
                                if (game.winner == user._id.toString()) {
                                    outcome = "Won";
                                } else {
                                    outcome = "Lost";
                                }
                                if (game.suddendeath) {
                                    outcome += " (Sudden Death)";
                                }
                            }

                            game.outcome = outcome;

                            games.push(game);
                        });
                        collection
                        .find({isFinished: true, $or : [{"challenger.db_id": user._id}, {"challengee.db_id": user._id}]})
                        .count(function(err, count) {
                            user.gamesPlayed = count;
                            db.collection('daily_rankings', function(err, collection) {
                                collection.findOne({user_id: user._id}, function(err, doc) {
                                    res.render('user', {
                                        'pageTitle': 'User Profile',
                                        user: user,
                                        games: games,
                                        stats: doc.stats
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    /**
     * Shared JS resources
     */
    app.get(/^\/shared\/js\/([a-z]+\.js)/, function(req, res) {
        var file = req.params[0];
        res.sendfile(__dirname+"/shared/"+file);
    });
}
