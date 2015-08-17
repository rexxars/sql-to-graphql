'use strict';

var b = require('ast-types').builders;

module.exports = function buildResolver(model, refField) {
    var ref = refField ? [b.literal(refField)] : [];
    return b.callExpression(
        b.identifier('getEntityResolver'),
        [b.literal(model.name)].concat(ref)
    );
};
