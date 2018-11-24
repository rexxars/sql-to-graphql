'use strict';

var capitalize = require('lodash/capitalize');

function aliasMultipleReferences(models, opts) {
    for (var type in models) {
        aliasReferences(models[type].references)
        aliasReferences(models[type].listReferences)
    }
    return models;
}

function aliasReferences(references) {
  // If a model refers more than once to another model,
  // we need to provide an alias field for additional
  // references. Append the ref field.
  let modelCnts = {}
  references.forEach( ref => {
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

module.exports = aliasMultipleReferences;
