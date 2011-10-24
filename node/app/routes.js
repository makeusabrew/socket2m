module.exports = function(app) {
    /**
     * Home Page
     */
    app.get('/', function(req, res) {
        res.sendfile(__dirname+"/static/index.html");
    });

    /**
     * About Page 
     */
    app.get('/about', function(req, res) {
        res.sendfile(__dirname+"/static/about.html");
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
