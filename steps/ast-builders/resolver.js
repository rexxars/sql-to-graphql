'use strict';

var b = require('ast-types').builders;
var buildObject = require('./object');

module.exports = function buildResolver(type, data) {
    var model = data.models[type.name];
    return b.callExpression(
        b.identifier('getEntityResolver'),
        [
            b.literal(model.table),
            buildObject(model.aliasedFields)
        ]
    );
};
