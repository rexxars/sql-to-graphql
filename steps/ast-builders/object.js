'use strict';

var b = require('ast-types').builders;

module.exports = function buildObject(obj) {
    var fields = [];
    for (var key in obj) {
        fields.push(b.property('init', b.literal(key), b.literal(obj[key])));
    }

    return b.objectExpression(fields);
};
