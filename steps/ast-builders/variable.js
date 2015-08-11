'use strict';

var b = require('ast-types').builders;

module.exports = function buildVar(name, val, es6) {
    var varStyle = es6 ? 'const' : 'var';
    return b.variableDeclaration(varStyle, [
        b.variableDeclarator(
            b.identifier(name),
            val
        )
    ]);
};
