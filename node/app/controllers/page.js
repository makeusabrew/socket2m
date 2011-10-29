var utils   = require('app/shared/utils');
var db      = require('app/db');

var app = null;
/**
 * global view variables (bleuch)
 */
var settings = {};

var augmentGame = function(game, user) {
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
        if (user) {
            if (game.winner == user._id.toString()) {
                outcome = "Won";
            } else {
                outcome = "Lost";
            }
        } else {
            // no user = general game view, so add the victor
            var winner= game.winner.toString() == game.challenger.db_id.toString() ?
                game.challenger :
                game.challengee;

            outcome = "Won by "+winner.username;
        }

        if (game.suddendeath) {
            outcome += " (Sudden Death)";
        }
    }

    game.outcome = outcome;
}

var PageController = {
    init: function(app) {
        settings.trackStats = app.enabled('trackStats')
    },

    index: function(req, res) {
        res.render('index', {
            "settings": settings
        });
    },

    about: function(req, res) {
        res.render('about', {
            'pageTitle': 'About',
            "settings": settings
        });
    },

    topUsers: function(req, res) {
        db.collection('users', function(err, collection) {
            collection
            .find()
            .limit(100)
            .sort({rank: -1})
            .toArray(function(err, docs) {
                var players = [];
                res.render('top-users', {
                    'pageTitle': 'Top 100 Players',
                    users: docs,
                    "settings": settings
                });
            });
        });
    },

    userProfile: function(req, res) {
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
                            augmentGame(game, user);

                            games.push(game);
                        });
                        collection
                        .find({isFinished: true, $or : [{"challenger.db_id": user._id}, {"challengee.db_id": user._id}]})
                        .count(function(err, count) {
                            user.gamesPlayed = count;
                            db.collection('daily_rankings', function(err, collection) {
                                collection.findOne({user_id: user._id}, function(err, doc) {
                                    var stats = [];
                                    if (doc != null) {
                                        stats = doc.stats;
                                    }
                                    res.render('user', {
                                        'pageTitle': 'User Profile',
                                        user: user,
                                        games: games,
                                        stats: stats,
                                        "settings": settings
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    },

    viewGame: function(req, res) {
        var gameId = new db.bson_serializer.ObjectID(req.params[0]);

        db.collection('games', function(err, collection) {
            collection.findOne({_id: gameId}, function(err, game) {
                augmentGame(game);
                res.render('game', {
                    'pageTitle': 'Game Report',
                    game: game
                });
            });
        });
    }
};

module.exports = PageController;
