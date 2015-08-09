'use strict';

var b = require('ast-types').builders;
var reduce = require('lodash/collection/reduce');
var getPrimaryKey = require('../../util/get-primary-key');
var buildObject = require('./object');

module.exports = function buildResolver(type, data, referingField) {
    var model = data.models[type.name];

    return b.callExpression(
        b.identifier('getEntityResolver'),
        [buildResolverArg()]
    );

    function buildResolverArg() {
        return b.objectExpression([
            b.property('init', b.identifier('table'), b.literal(model.table)),
            b.property('init', b.identifier('primaryKey'), getPrimaryKeyArg()),
            b.property('init', b.identifier('aliases'), buildObject(model.aliasedFields)),
            b.property('init', b.identifier('reference'), getReferenceArg()),
            b.property('init', b.identifier('referenceMap'), getRefFieldMapArg())
        ]);
    }

    function getRefFieldMapArg() {
        if (referingField) {
            return b.identifier('null');
        }

        var referenceMap = reduce(model.references, buildReferenceMap, {});
        return buildObject(referenceMap);
    }

    function getPrimaryKeyArg() {
        var primaryKey = getPrimaryKey(model);
        return primaryKey ?
            b.literal(primaryKey.originalName) :
            b.identifier('null');
    }

    function getReferenceArg() {
        return referingField ?
            b.literal(referingField) :
            b.identifier('null');
    }
};

function buildReferenceMap(refMap, reference) {
    refMap[reference.field] = reference.refField;
    return refMap;
}
