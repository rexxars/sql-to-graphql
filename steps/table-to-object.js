'use strict';

var pluralize = require('pluralize');
var camelCase = require('lodash/string/camelCase');
var capitalize = require('lodash/string/capitalize');
var columnToObject = require('./column-to-object');

function tableToObject(table, opts) {
    var normalized = normalizeTableName(table.name, {
        suffix: opts['strip-suffix'],
        prefix: opts['strip-prefix']
    });

    var model = {
        name: getTypeName(normalized),
        description: table.comment,
        table: table.name,
        normalizedTable: normalized,
        fields: table.columns.reduce(reduceColumn, {})
    };

    return model;
}

function getTypeName(item) {
    return pluralize(capitalize(camelCase(item)), 1);
}

function reduceColumn(fields, column) {
    var col = columnToObject(column);
    fields[col.name] = col;
    return fields;
}

function normalizeTableName(name, strip) {
    (strip.suffix || []).forEach(function(suffix) {
        name = name.replace(new RegExp(escapeRegExp(suffix) + '$'), '');
    });

    (strip.prefix || []).forEach(function(prefix) {
        name = name.replace(new RegExp('^' + escapeRegExp(prefix)), '');
    });

    return name;
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = tableToObject;
