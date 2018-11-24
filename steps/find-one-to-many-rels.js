'use strict'

const async = require('async')
const after = require('lodash/after')
const camelCase = require('lodash/camelCase')
const capitalize = require('lodash/capitalize')
const pluralize = require('pluralize')

module.exports = function findOneToManyRelationships(adapter, models, callback) {
  const tasks = Object.keys(models).reduce(function(tasklist, model) {
    tasklist[model] = function(cb) {
      findRelationships(adapter, models[model], models, cb)
    }
    return tasklist
  }, {})

  async.parallel(tasks, callback)
}

function findRelationships(adapter, model, models, callback) {
  if (!model.references.length) {
    return setImmediate(callback, null, model)
  }

  const done = after(model.references.length, callback)
  model.references.forEach(function(ref) {
    let reverseRefs = ref.model.listReferences
    const refName = camelCase(pluralize(model.name))
    const description = 'List of ' + refName + ' belonging to this ' + ref.model.name

    reverseRefs.push({
      model: model,
      description: description,
      field: refName,
      refField: ref.refField,
      isList: true
    })

    done(null, model)
  })
}

function getUnaliasedField(field, model) {
  for (let unaliased in model.aliasedFields) {
    if (model.aliasedFields[unaliased] === field) {
      return unaliased
    }
  }
  return field
}
