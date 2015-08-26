'use strict';

var b = require('ast-types').builders;
var buildTypeImports = require('./type-imports');
var buildExports = require('./exports');

module.exports = function buildType(type, opts) {
    var imports = buildTypeImports(type, opts);
    var typeAst = type.ast;
    var typeExport = [buildExports(b.identifier(type.varName), opts)];
    var register = [b.expressionStatement(
        b.callExpression(
            b.identifier('registerType'),
            [b.identifier(type.varName)]
        )
    )];

    return b.program([]
        .concat(imports)
        .concat(typeAst)
        .concat(register)
        .concat(typeExport)
    );
};
