'use strict';

var log = require('../util/log');
var filter = require('lodash/collection/filter');
var snakeCase = require('lodash/string/snakeCase');
var capitalize = require('lodash/string/capitalize');

function findReferences(models) {
    for (var type in models) {
        models[type].references = findReferencesForModel(models[type], models);
    }

    return models;
}

function findReferencesForModel(model, models) {
    // Find columns that end with "Id"
    var refs = filter(model.fields, isIdColumn);

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        var parts = snakeCase(col.name.substr(0, col.name.length - 2)).split('_');
        do {
            var name = parts.map(capitalize).join('');

            // Do we have a match for this?
            if (models[name]) {
                references[col.name] = models[name];
                return references;
            }

            parts.shift();
        } while (parts.length > 0);

        return references;
    }, {});
}

function isIdColumn(col) {
    return !col.isPrimaryKey && col.name.substr(-2) === 'Id';
}

module.exports = findReferences;
