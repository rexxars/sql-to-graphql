'use strict';

var b = require('ast-types').builders;

module.exports = function buildResolver(model) {
    return b.callExpression(
        b.identifier('getEntityResolver'),
        [b.literal(model.name)]
    );
};