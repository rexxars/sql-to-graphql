'use strict'

const filter = require('lodash/filter')
const find = require('lodash/find')
const snakeCase = require('lodash/snakeCase')
const camelCase = require('lodash/camelCase')
const capitalize = require('lodash/capitalize')
const pluralize = require('pluralize')

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
    for (let type in models) {
        findListReferences(models[type])
    }
    for (let type in models) {
        aliasReferences(models[type].references)
        aliasReferences(models[type].listReferences)
    }

    return models
}

function findReferencesForModelByID(model, models) {
    // Find columns that end with "Id"
    const refs = filter(model.fields, isIdColumn)

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
                // if (fields.indexOf(fieldName) !== -1) {
                //     fieldName += 'Ref'
                // }

                if (find(model.fields, { isPrimaryKey: true })) {
                    let description = capitalize(fieldName) + ' referenced by this ' + model.name
                    references.push({
                        model: models[name],
                        field: fieldName,
                        refField: col.name,
                        description: description
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

function findListReferences(model) {
    model.references.forEach(function(ref) {
        const refName = camelCase(pluralize(model.name))
        const description = 'List of ' + refName + ' belonging to this ' + ref.model.name

        ref.model.listReferences.push({
            model: model,
            description: description,
            field: refName,
            refField: ref.refField,
            isList: true
        })
    })
}

function aliasReferences(references) {
    // If a model refers more than once to another model,
    // we need to provide an alias field for additional
    // references. Append the ref field.
    let modelCnts = {}
    references.forEach(ref => {
        if (modelCnts[ref.field]) {
            modelCnts[ref.field]++
        } else {
            modelCnts[ref.field] = 1
        }
    })

    references.forEach(ref => {
        const field = ref.field
        if (modelCnts[field] > 1 || ref.model.fields[field]) {
            const colAlias = capitalize(ref.refField).replace(/id$/i, '')
            ref.field = field + colAlias
            if (ref.description) {
                ref.description += ' (' + colAlias + ')'
            }
        }
    })
}

module.exports = findReferences
