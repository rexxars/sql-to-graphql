'use strict';

var pluralize = require('pluralize');
var camelCase = require('lodash/string/camelCase');
var capitalize = require('lodash/string/capitalize');
var indexBy = require('lodash/collection/indexBy');
var columnToObject = require('./column-to-object');

function tableToObject(table, opts) {
    var normalized = normalizeTableName(table.name, {
        suffix: opts.stripSuffix,
        prefix: opts.stripPrefix
    });

    var fields = table.columns.map(function(column) {
        return columnToObject(column, opts);
    });

    var model = {
        name: getTypeName(normalized),
        description: table.comment,
        table: table.name,
        normalizedTable: normalized,
        fields: indexBy(fields, 'name'),
        aliasedFields: fields.reduce(function(aliases, field) {
            if (field.name !== field.originalName) {
                aliases[field.name] = field.originalName;
            }

            return aliases;
        }, {})
    };

    return model;
}

function getTypeName(item) {
    return pluralize(capitalize(camelCase(item)), 1);
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
