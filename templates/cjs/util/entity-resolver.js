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
    return function resolveEntity(parent, args, ast) {
        var isList = ast.returnType instanceof GraphQL.GraphQLList;
        var clauses = getClauses(ast, args, typeData.aliases);
        var selection = getSelectionSet(type, ast.fieldASTs[0], typeData.aliases, typeData.referenceMap);
        var hasPkSelected =
            typeData.primaryKey &&
            selection.some(function(item) {
                return item.indexOf(typeData.primaryKey) === 0;
            });

        if (typeData.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(typeData.primaryKey, pkAlias));
        }

        if (parent) {
            var parentTypeData = resolveMap[ast.parentType.name];
            var refField = parentTypeData.referenceMap[ast.fieldName];
            var listRefField = parentTypeData.listReferences[ast.fieldName];

            if (refField) {
                var unliasedRef = getUnaliasedName(refField, parentTypeData.aliases);
                clauses[typeData.primaryKey] = parent[refField] || parent[unliasedRef];
            } else if (listRefField) {
                var parentPk = parentTypeData.aliases[parentTypeData.primaryKey] || parentTypeData.primaryKey;
                clauses[listRefField] = parent[parentPk];
            }
        }

        var query = (
            isList ? db().select(selection) : db().first(selection)
        ).from(typeData.table).where(clauses).limit(25);

        if (isList) {
            query.limit(args.limit || 25).offset(args.offset || 0);
        }

        if (config.debug) {
            console.log(query.toSQL());
        }

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

function getClauses(ast, args, aliases) {
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
