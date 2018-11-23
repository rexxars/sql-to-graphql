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

    async.parallel(tasks, () => {
      aliasMultipleReferences(models)
      callback()
    });
};

function findRelationships(adapter, model, models, callback) {
    if (!model.references.length) {
        return setImmediate(callback, null, model);
    }

    var done = after(model.references.length, callback)
    model.references.forEach(function(ref) {
        var referenceColumn = getUnaliasedField(ref.refField, model);
        adapter.hasDuplicateValues(model.table, referenceColumn, function(err, hasDupes) {
            if (err) {
                return callback(err);
            }

            // if (!hasDupes) {
            //     return done(null, model);
            // }
            var reverseRefs = ref.model.listReferences;
            var refName = pluralize(model.name);
            // var refName = camelCase(pluralize(model.name));
            var description = pluralize(model.name) + ' belonging to this ' + ref.model.name;
            // if (find(reverseRefs, { field: refName }) || ref.model.fields[refName]) {
            //     // @TODO find a better name algo resolve mechanism
            //     // `thread_id` should naturally be `threads`, while `old_thread_id` should be.. something else
            //     refName += capitalize(ref.refField).replace(/id$/i, '');
            //     description += '..? (' + referenceColumn + ')';
            // }

            reverseRefs.push({
                model: model,
                description: description,
                field: refName,
                refField: ref.refField,
                isList: true
            });

            done(null, model);
        });
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

function aliasMultipleReferences(models) {
    for (var type in models) {
        aliasListReferences(models[type].listReferences)
    }
}


function aliasListReferences(references) {
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
  console.log('modelCnts', modelCnts)

  references.forEach(ref => {
    if (modelCnts[ref.field] > 1) {
      ref.field = ref.field + capitalize(ref.refField).replace(/id$/i, '')
    }
  })
}

