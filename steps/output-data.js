'use strict';

var printAst = require('../util/print-ast');
var buildProgram = require('./ast-builders/program');

function outputData(data, opts) {
    if (!opts.outputDir) {
        return printAst(
            buildProgram(data, opts),
            opts
        );
    }

    // Output to a directory, in other words: split stuff up
    // @todo
}

module.exports = outputData;
