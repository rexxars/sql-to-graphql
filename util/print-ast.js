'use strict';

var recast = require('recast');
var cardinal = require('cardinal');

module.exports = function printAst(ast, opts) {
    var code = recast.prettyPrint(ast, opts).code;

    console.log(
        opts.colors ?
        cardinal.highlight(code) :
        code
    );
};
