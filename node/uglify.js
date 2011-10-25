var jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify,
    fs  = require('fs');

// take the directory to watch...
var srcDir   = process.argv[2];

// ... and the destination file as command line arguments
var destFile = process.argv[3];

var sourceFiles = fs.readdirSync(srcDir);
var compressedFiles = {};

for (var i = sourceFiles.length-1; i >= 0; i--) {
    if (sourceFiles[i] == "client.js") {
        sourceFiles.splice(i, 1);
    }
}
sourceFiles.unshift("client.js");

var compile = function(file, cb) {
    var code = fs.readFileSync(file, "utf8");

    if (compressedFiles[file] == null) {
        console.log("compressing "+file);
    } else {
        console.log("re-compressing "+file);
    }

    var ast = jsp.parse(code); // parse code and get the initial AST
    ast = pro.ast_mangle(ast); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
    var final_code = pro.gen_code(ast); // compressed code here

    compressedFiles[file] = final_code;

    if (typeof cb == 'function') {
        var output = "";
        for (var i in compressedFiles) {
            output += compressedFiles[i]+";";
        }
        cb(output);
    }
}

/**
 * Go! 
 */
sourceFiles.forEach(function(file) {
    if (file.match(/\.js$/)) {
        var fullPath = srcDir+file;
        compile(fullPath);
        fs.watchFile(fullPath, function(curr, prev) {
            if (curr.mtime > prev.mtime) {
                console.log(file+" modified!");
                compile(fullPath, function(output) {
                    fs.writeFile(destFile, output, function(err) {
                        if (err) throw err;
                        console.log("written file to "+destFile);
                    });
                });
            } else {
                console.log(file+" accessed...");
            }
        });
    }
});
