'use strict';

var GraphQL = require('graphql');
var db = require('../db')

function getResolver(opts) {
    var pkAlias = opts.primaryKey ? opts.aliases[opts.primaryKey] : null;
    return function resolveEntity(parent, args, src, ast, type) {
        var isList = type instanceof GraphQL.GraphQLList;
        var clauses = getClauses(ast, opts.aliases);
        var selection = getSelectionSet(ast, opts.aliases, opts.referenceMap);
        var hasPkSelected = opts.primaryKey && selection.some(function(item) {
            return item.indexOf(opts.primaryKey) === 0;
        });

        if (opts.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(opts.primaryKey, pkAlias));
        }

        if (parent && opts.reference) {
            clauses[opts.reference] = parent[opts.reference];
        }

        var query = (
            isList ? db().select(selection) : db().first(selection)
        ).from(opts.table).where(clauses);

        return query;
    };
}

function getSelectionSet(ast, aliases, referenceMap) {
    return ast.selectionSet.selections.reduce(function reduceSelectionSet(set, selection) {
        var alias, field;

        // For fields with its own selection set, we need to fetch the reference ID
        if (selection.selectionSet && referenceMap) {
            alias = referenceMap[selection.name.value];
            field = getUnaliasedName(alias, aliases);
            set.push(field || alias);
            return set;
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
