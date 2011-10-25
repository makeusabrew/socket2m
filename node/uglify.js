var jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify,
    fs  = require('fs');

var sourceFiles = fs.readdirSync(__dirname+"/../src/js");

for (var i = sourceFiles.length-1; i >= 0; i--) {
    if (sourceFiles[i] == "client.js") {
        sourceFiles.splice(i, 1);
    }
}

sourceFiles.unshift("client.js");

var output = "";

sourceFiles.forEach(function(file) {
    if (file.match(/\.js$/)) {

        var code = fs.readFileSync(__dirname+"/../src/js/"+file, "utf8");
        var ast = jsp.parse(code); // parse code and get the initial AST
        ast = pro.ast_mangle(ast); // get a new AST with mangled names
        ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
        var final_code = pro.gen_code(ast); // compressed code here

        output += final_code;
    }
});

fs.writeFile(__dirname+"/../public/js/run.js", output, function(err) {
    if (err) throw err;
    console.log("done");
});
