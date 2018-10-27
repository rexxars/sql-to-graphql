'use strict';

var GraphQL = require('graphql');
var resolveMap = require('../resolve-map').resolveMap;
var getSelectionSet = require('./get-selection-set');
var getUnaliasedName = require('./get-unaliased-name');
var db = require('../db');
var config = require('../config/config');

function getResolver(type) {
    var typeData = resolveMap[type];

    if (!typeData) {
        throw new Error('Type "' + type + '" not a recognized type');
    }

    var pkAlias = typeData.primaryKey ? typeData.aliases[typeData.primaryKey] : null;
    return function resolveEntity(parent, args, contextValue, info) {
        var isList = info.returnType instanceof GraphQL.GraphQLList;
        var clauses = getClauses(args, typeData.aliases);
        var selection = getSelectionSet(type, info.fieldNodes[0], typeData.aliases, typeData.referenceMap);
        var hasPkSelected =
            typeData.primaryKey &&
            selection.some(function(item) {
                return item.indexOf(typeData.primaryKey) === 0;
            });

        if (typeData.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(typeData.primaryKey, pkAlias));
        }

        if (parent) {
            var parentTypeData = resolveMap[info.parentType.name];
            var refField = parentTypeData.referenceMap[info.fieldName];
            var listRefField = parentTypeData.listReferences[info.fieldName];

            if (refField) {
                var unliasedRef = getUnaliasedName(refField, parentTypeData.aliases);
                clauses[typeData.primaryKey] = parent[refField] || parent[unliasedRef];
            } else if (listRefField) {
                var parentPk = parentTypeData.aliases[parentTypeData.primaryKey] || parentTypeData.primaryKey;
                clauses[listRefField] = parent[parentPk];
            }
        }

        var query = (isList
            ? db()
                .select(selection)
                .limit(args.limit || 25)
                .offset(args.offset || 0)
            : db().first(selection)
          )
            .from(typeData.table)
            .where(clauses)
            
        // @TODO Find a much less hacky and error prone to handle this
        // Ties together with the Node type in Relay!
        return query.then(function(result) {
            if (result) {
                result.__type = typeData.type;
            }

            return result;
        });
    };
}

function getClauses(args, aliases) {
    return Object.keys(args).reduce(function(query, alias) {
        if (alias === 'limit' || alias === 'offset') {
            return query;
        }

        var field = getUnaliasedName(alias, aliases);
        query[field || alias] = args[alias];
        return query;
    }, {});
}

function getAliasSelection(field, alias) {
    if (alias) {
        return field + ' AS ' + alias;
    }

    return field;
}

module.exports = getResolver;
