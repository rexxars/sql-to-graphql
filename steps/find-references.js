'use strict';

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
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        var colName = col.name.substr(0, col.name.length - 2).replace(/^parent/, '');
        var parts = snakeCase(colName).split('_'), fieldName;

        do {
            var name = parts.map(capitalize).join('');

            // Do we have a match for this?
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '');

                // If we collide with a different field name, add a "Ref"-suffix
                if (fields.indexOf(fieldName) !== -1) {
                    fieldName += 'Ref';
                }

                references.push({
                    model: models[name],
                    field: fieldName,
                    refField: col.name
                });

                return references;
            }

            parts.shift();
        } while (parts.length > 0);

        return references;
    }, []);
}

function isIdColumn(col) {
    return !col.isPrimaryKey && col.name.substr(-2) === 'Id';
}

module.exports = findReferences;
