'use strict';

var b = require('ast-types').builders;

module.exports = function buildExports(val, opts) {
    if (opts.es6) {
        return b.exportDeclaration(true, val);
    }

    return b.expressionStatement(
        b.assignmentExpression(
            '=',
            b.memberExpression(
                b.identifier('module'),
                b.identifier('exports'),
                false
            ),
            val
        )
    );
};
