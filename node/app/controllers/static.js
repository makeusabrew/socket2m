var jade = require('jade'),
    fs   = require('fs');

var compiledContents = {};

var StaticController = {
    fetchContentsForState: function(state) {
        if (compiledContents[state] == null) {
            var data = fs.readFileSync(__dirname+"/../../views/states/"+state+".jade");
            var fn = jade.compile(data);
            var output = fn();
            compiledContents[state] = output;
        }
        return compiledContents[state];
    }
};

module.exports = StaticController;
