module.exports = function(app) {
    /**
     * Home Page
     */
    app.get('/', function(req, res) {
        res.render('index', {
            'scripts': true
        });
    });

    /**
     * About Page 
     */
    app.get('/about', function(req, res) {
        res.render('about');
    });

    /**
     * User profile page
     */
    app.get('/user/:username', function(req, res) {
        var db = require(__dirname+"/../app/db");
        db.collection('users', function(err, collection) {
            collection.findOne({"username": req.params.username}, function(err, result) {
                res.render('user', {
                    user: result
                });
            });
        });
    });
}
