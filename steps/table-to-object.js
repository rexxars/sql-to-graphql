'use strict';

var pluralize = require('pluralize');
var camelCase = require('lodash/string/camelCase');
var capitalize = require('lodash/string/capitalize');
var columnToObject = require('./column-to-object');

function tableToObject(table, opts) {
    var model = {
        name: getTypeName(table.name, opts['strip-suffix']),
        description: table.comment,
        table: table.name,
        fields: table.columns.reduce(reduceColumn, {})
    };

    return model;
}

function getTypeName(item, strip) {
    strip.forEach(function(suffix) {
        item = item.replace(new RegExp(escapeRegExp(suffix) + '$'), '');
    });

    return pluralize(capitalize(camelCase(item)), 1);
}

function reduceColumn(fields, column) {
    var col = columnToObject(column);
    fields[col.name] = col;
    return fields;
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = tableToObject;
