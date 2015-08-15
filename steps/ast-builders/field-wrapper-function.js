'use strict';

var b = require('ast-types').builders;

module.exports = function buildFieldWrapperFunc(name, fields, opts) {
    if (opts.es6) {
        return b.arrowFunctionExpression([], fields);
    }

    return b.functionExpression(
        b.identifier('get' + name + 'Fields'),
        [],
        b.blockStatement([
            b.returnStatement(fields)
        ])
    );
};
