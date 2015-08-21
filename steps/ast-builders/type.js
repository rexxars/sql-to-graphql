'use strict';

var b = require('ast-types').builders;
var buildTypeImports = require('./type-imports');
var buildExports = require('./exports');

module.exports = function buildType(type, opts) {
    return b.program(
        buildTypeImports(type, opts)
            .concat(type.ast)
            .concat([
                buildExports(b.identifier(type.varName), opts)
            ])
    );
};
