'use strict';

var GraphQL = require('graphql');
var resolveMap = require('../resolve-map').resolveMap;
var db = require('../db')

function getResolver(type) {
    var typeData = resolveMap[type];

    if (!typeData) {
        throw new Error('Type "' + type + '" not a recognized type');
    }

    var pkAlias = typeData.primaryKey ? typeData.aliases[typeData.primaryKey] : null;
    return function resolveEntity(parent, args, ast, override) {
        var operation = ast.operation.selectionSet.selections[0];

        var isList = ast.returnType instanceof GraphQL.GraphQLList;
        var clauses = getClauses(override || ast, typeData.aliases);
        var selection = getSelectionSet(type, operation, typeData.aliases, typeData.referenceMap);
        var hasPkSelected = (
            typeData.primaryKey &&
            selection.some(function(item) {
                return item.indexOf(typeData.primaryKey) === 0;
            })
        );

        if (typeData.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(typeData.primaryKey, pkAlias));
        }

        var refField = typeData.referenceMap[ast.fieldName];
        if (parent && refField) {
            var unliasedRef = getUnaliasedName(refField, typeData.aliases);
            clauses[typeData.primaryKey] = parent[refField] || parent[unliasedRef];
        }

        var query = (
            isList ? db().select(selection) : db().first(selection)
        ).from(typeData.table).where(clauses).then(function(result) {
            if (result) {
                result.__type = typeData.type;
            }

            return result;
        });

        return query;
    };
}

function getSelectionSet(type, ast, aliases, referenceMap) {
    return ast.selectionSet.selections.reduce(function reduceSelectionSet(set, selection) {
        // If we encounter a selection with a type condition, make sure it's the correct type
        if (selection.typeCondition && selection.typeCondition.name.value !== type) {
            return set;
        }

        var alias, field;
        if (selection.kind === 'Field' && selection.selectionSet && referenceMap) {
            // For fields with its own selection set, we need to fetch the reference ID
            alias = referenceMap[selection.name.value];
            field = getUnaliasedName(alias, aliases);
            set.push(field || alias);
            return set;
        } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
            // And for inline fragments, we need to recurse down and combine the set
            return set.concat(getSelectionSet(type, selection, aliases, referenceMap));
        } else if (selection.selectionSet) {
            return set;
        }

        alias = selection.name.value;
        field = getUnaliasedName(alias, aliases);
        set.push(field ? field + ' AS ' + alias : alias);
        return set;
    }, []);
}

function getClauses(ast, aliases) {
    if (!ast.arguments) {
        return {};
    }


    return ast.arguments.reduce(function reduceClause(query, arg) {
        var alias = arg.name.value;
        var field = getUnaliasedName(alias, aliases);
        query[field || alias] = typecastValue(arg.value);
        return query;
    }, {});
}

function typecastValue(value) {
    var val = value.value;
    switch (value.kind) {
        case 'IntValue':
            return parseInt(val, 10);
        default:
            return val;
    }
}

function getUnaliasedName(alias, aliases) {
    for (var key in aliases) {
        if (aliases[key] === alias) {
            return key;
        }
    }
}

function getAliasSelection(field, alias) {
    if (alias) {
        return field + ' AS ' + alias;
    }

    return field;
}


module.exports = getResolver;
