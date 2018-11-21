'use strict';

var filter = require('lodash/filter');
var find = require('lodash/find');
var snakeCase = require('lodash/snakeCase');
var camelCase = require('lodash/camelCase');
var capitalize = require('lodash/capitalize');

function aliasMultipleReferences(models, opts) {
    for (var type in models) {
        models[type].references =
            opts.rel === 'colids' ? findReferencesForModelByID(models[type], models) :
            opts.rel === 'backend' ? findReferencesForModelBackend(models[type], models) :
            [];
        models[type].listReferences = [];
    }

    return models;
}

function aliasMultipleReferences(model) {
  // If a model refers more than once o another model,
  // we need to provide an alias field for additional
  // references. Just append 2, 3 ...
  let refModels = {}
  model.references.forEach(ref => {
    let field = ref.field
    if (refModels[field]) {
      ref.fieldAlias = field + refModels[field]++
    } else {
      refModels[field] = 1
      ref.fieldAlias = field
    }
  })
}


module.exports = findReferences;
