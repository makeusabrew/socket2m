var PageController = require('app/controllers/page');

module.exports = function(app) {
    PageController.init(app);
    /**
     * Home Page
     */
    app.get('/', function(req, res) {
        PageController.index(req, res);
    });

    /**
     * About Page 
     */
    app.get('/about', function(req, res) {
        PageController.about(req, res);
    });

    /**
     * Top 100 users
     */
    app.get('/users/top', function(req, res) {
        PageController.topUsers(req, res);
    });

    /**
     * User profile page
     */
    app.get(/\/user\/([A-z0-9_]+)/, function(req, res) {
        PageController.userProfile(req, res);
    });

    /**
     * Shared JS resources
     */
    app.get(/^\/shared\/js\/([a-z]+\.js)/, function(req, res) {
        var file = req.params[0];
        res.sendfile(__dirname+"/shared/"+file);
    });
}
