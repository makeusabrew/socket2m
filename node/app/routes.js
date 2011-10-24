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
}
