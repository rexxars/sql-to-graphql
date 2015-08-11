'use strict';

var b = require('ast-types').builders;
var buildImports = require('./imports');
var buildExports = require('./exports');

module.exports = function buildType(type, opts) {
    return b.program(
        buildImports(type.imports, opts).concat(type.ast).concat([
            buildExports(b.identifier(type.varName))
        ])
    );
};
