'use strict'

const filter = require('lodash/filter')
const find = require('lodash/find')
const snakeCase = require('lodash/snakeCase')
const camelCase = require('lodash/camelCase')
const capitalize = require('lodash/capitalize')

function findReferences(models, opts) {
    for (let type in models) {
        models[type].references =
            opts.rel === 'colids'
                ? findReferencesForModelByID(models[type], models)
                : opts.rel === 'backend'
                ? findReferencesForModelBackend(models[type], models)
                : []
        models[type].listReferences = []
    }

    return models
}

function findReferencesForModelByID(model, models) {
    // Find columns that end with "Id"
    const refs = filter(model.fields, isIdColumn)
    let fields = Object.keys(model.fields)

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        const colName = col.name.substr(0, col.name.length - 2).replace(/^parent/, '')
        const parts = snakeCase(colName).split('_')

        let fieldName
        do {
            const name = parts.map(capitalize).join('')

            // Do we have a match for this?
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '')

                // If we collide with a different field name, add a "Ref"-suffix
                if (fields.indexOf(fieldName) !== -1) {
                    fieldName += 'Ref'
                }

                if (find(model.fields, { isPrimaryKey: true })) {
                    references.push({
                        model: models[name],
                        field: fieldName,
                        refField: col.name
                    })
                }

                return references
            }

            parts.shift()
        } while (parts.length > 0)

        return references
    }, [])
}

function isIdColumn(col) {
    return !col.isPrimaryKey && col.name.substr(-2) === 'Id'
}

function findReferencesForModelBackend(model, models) {
    const refs = filter(model.fields, isForeignKeyColumn)
    // var fields = Object.keys(model.fields)

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        // Ensure referenced table is in the model list
        var refModel
        if ((refModel = find(models, { table: col.refTableName }))) {
            var fieldName = camelCase(refModel.name)

            // If we collide with a different field name, add a "Ref"-suffix
            // if (fields.indexOf(fieldName) !== -1) {
            //     fieldName += 'Ref';
            // }

            // Ensure table has primary key
            // Does not handle multi-column keys
            if (find(model.fields, { isPrimaryKey: true })) {
                let description = refModel.name + ' referenced by this ' + model.name
                references.push({
                    model: refModel,
                    field: fieldName,
                    refField: col.name,
                    description: description
                })
            }
        }

        return references
    }, [])
}

function isForeignKeyColumn(col) {
    return !!col.refTableName
}

module.exports = findReferences
