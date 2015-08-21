'use strict';

var fs = require('fs');
var path = require('path');
var recast = require('recast');

module.exports = function buildNodeDefinitions(opts) {
    var tplPath = path.join(__dirname, 'templates');
    var tpl = opts.es6 ? 'node-def-es6.js' : 'node-def-cjs.js';
    var ast = recast.parse(fs.readFileSync(path.join(tplPath, tpl)));

    return ast;
};
