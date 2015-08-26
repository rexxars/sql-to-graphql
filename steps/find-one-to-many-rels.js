'use strict';

var async = require('async');
var after = require('lodash/function/after');
var find = require('lodash/collection/find');
var camelCase = require('lodash/string/camelCase');
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

    var done = after(model.references.length, callback);
    model.references.forEach(function(ref) {
        adapter.hasDuplicateValues(model.table, getUnaliasedField(ref.refField, model), function(err, hasDupes) {
            if (err) {
                return callback(err);
            }

            if (!hasDupes) {
                return done(null, model);
            }


            var reverseRefs = ref.model.references;
            var refName = camelCase(pluralize(model.name));
            if (find(model.reverseRefs, { field: refName }) || ref.model.fields[refName]) {
                refName += 'Ref';
            }

            reverseRefs.push({
                model: model,
                description: pluralize(model.name) + ' belonging to this ' + ref.model.name,
                field: refName,
                refField: null,
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
}
