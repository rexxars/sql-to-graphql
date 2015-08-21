'use strict';

var b = require('ast-types').builders;

module.exports = function buildTypeRegistration(opts) {
    return b.forInStatement(
        b.variableDeclaration(opts.es6 ? 'let' : 'var', [
            b.variableDeclarator(b.identifier('type'), null)
        ]),
        b.identifier('types'),
        b.blockStatement([b.expressionStatement(
            b.callExpression(
                b.identifier('registerType'),
                [b.memberExpression(
                    b.identifier('types'),
                    b.identifier('type'),
                    true
                )]
            )
        )])
    );
};
