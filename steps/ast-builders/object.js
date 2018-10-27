'use strict';

var b = require('ast-types').builders;
var isPlainObject = require('lodash/isPlainObject');

function buildObject(obj) {
    var fields = [], key;
    for (key in obj) {
        fields.push(b.property('init', b.literal(key), castValue(obj[key])));
    }

    return b.objectExpression(fields);
}

function castValue(val) {
    if (isPlainObject(val)) {
        return buildObject(val);
    } else if (val === null) {
        return b.identifier('null');
    } else if (typeof val === 'undefined') {
        return b.identifier('undefined');
    }

    return b.literal(val);
}

module.exports = buildObject;
