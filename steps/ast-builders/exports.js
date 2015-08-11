'use strict';

var b = require('ast-types').builders;

module.exports = function buildExports(val, es6) {
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
