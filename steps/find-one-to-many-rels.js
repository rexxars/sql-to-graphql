'use strict';

var async = require('async');
var after = require('lodash/after');
var camelCase = require('lodash/camelCase');
var capitalize = require('lodash/capitalize');
var pluralize = require('pluralize');

module.exports = function findOneToManyRelationships(adapter, models, callback) {
    var tasks = Object.keys(models).reduce(function(tasklist, model) {
        tasklist[model] = function(cb) {
            findRelationships(adapter, models[model], models, cb);
        };
        return tasklist;
    }, {});

    async.parallel(tasks, callback);
};

function findRelationships(adapter, model, models, callback) {
    if (!model.references.length) {
        return setImmediate(callback, null, model);
    }

    var done = after(model.references.length, callback)
    model.references.forEach(function(ref) {
      var referenceColumn = getUnaliasedField(ref.refField, model);
          var reverseRefs = ref.model.listReferences;
          var refName = camelCase(pluralize(model.name));
          var description = 'List of ' + refName + ' belonging to this ' + ref.model.name;

          reverseRefs.push({
              model: model,
              description: description,
              field: refName,
              refField: ref.refField,
              isList: true
          });

          done(null, model);
      });
}

function getUnaliasedField(field, model) {
    for (var unaliased in model.aliasedFields) {
        if (model.aliasedFields[unaliased] === field) {
            return unaliased;
        }
    }
    return field
}

