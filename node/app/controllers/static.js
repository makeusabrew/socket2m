var jade = require('jade'),
    fs   = require('fs');

var compiledContents = {};

var StaticController = {
    fetchContentsForState: function(state) {
        if (compiledContents[state] == null) {
            var filename = __dirname+"/../../views/states/"+state+".jade";
            var data = fs.readFileSync(filename);
            var fn = jade.compile(data, {
                filename: filename
            });
            var output = fn();
            compiledContents[state] = output;
        }
        return compiledContents[state];
    }
};

module.exports = StaticController;
