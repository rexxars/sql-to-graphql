'use strict';

var camelCase = require('lodash/string/camelCase');
var capitalize = require('lodash/string/capitalize');
var columnToObject = require('../util/column-to-object');

function tableToObject(table) {
    var model = {
        name: getTypeName(table.name),
        description: table.comment,
        table: table.name,
        fields: table.columns.reduce(reduceColumn, {})
    };

    return model;
}

function getTypeName(item) {
    return capitalize(camelCase(item));
}

function reduceColumn(fields, column) {
    var col = columnToObject(column);
    fields[col.name] = col;
    return fields;
}

module.exports = tableToObject;
