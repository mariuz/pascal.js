var LLC = "llc-18",
    WASM_LD = "wasm-ld-18",
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec;

function Compiler() {

  function compile(infile, outfile, callback) {
    var Parse = require('./parse'),
        IR = require('./ir.js'),
        source = fs.readFileSync(infile, "utf8"),
        ast = Parse.parser.parse(source),
        ir = IR.toIR(ast),
        tmpobj = outfile + '.o',
        child;
    child = exec(LLC + ' -march=wasm32 -filetype=obj -o ' + tmpobj + ' -',
        function(error, stdout, stderr) {
      if (error !== null) {
        throw new Error("Errors during compilation:\n" + stderr);
      }
      link(tmpobj, outfile, callback);
    });
    child.stdin.write(ir);
    child.stdin.end();
  }

  function link(objfile, outfile, callback) {
    exec(WASM_LD + ' --no-entry --export-all --allow-undefined -o ' +
        outfile + ' ' + objfile, function(error, stdout, stderr) {
      if (error !== null) {
        throw new Error("Errors during linking:\n" + stderr);
      }
      if (callback) { callback(); }
    });
  }

  return {compile: compile,
          link: link};
}

if (typeof module !== 'undefined') {
  exports.Compiler = Compiler;

  exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' SOURCE_FILE [OUTFILE]');
        process.exit(1);
    }
    var infile = path.normalize(args[1]),
        outfile = args[2] || 'a.out.wasm',
        compiler = new Compiler();
    compiler.compile(infile, outfile);
  }
  if (require.main === module) {
    exports.main(process.argv.slice(1));
  }
}

// vim: expandtab:ts=2:sw=2:syntax=javascript
