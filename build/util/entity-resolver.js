'use strict';

var GraphQL = require('graphql');
var GraphQLList = GraphQL.GraphQLList;

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'host',
        user: 'user',
        password: 'pass',
        database: 'db'
    }
});

function getResolver(source, aliases) {
    return function resolveEntity(parent, args, src, ast, type) {
        var isList = type instanceof GraphQLList;
        var clauses = getClauses(ast, aliases);
        var selection = getSelectionSet(ast, aliases);
        var query = (
            isList ? knex.select(selection) : knex.first(selection)
        ).from(source).where(clauses);

        return query;
    };
}

function getSelectionSet(ast, aliases) {
    return ast.selectionSet.selections.reduce(function reduceSelectionSet(set, selection) {
        // Skip fields with its own selection set
        if (selection.selectionSet) {
            return set;
        }

        var field = selection.name.value;
        var alias = aliases[field];
        set.push(alias ? alias + ' AS ' + field : field);
        return set;
    }, []);
}

function getClauses(ast, aliases) {
    return ast.arguments.reduce(function reduceClause(query, arg) {
        var field = arg.name.value;
        var alias = aliases[field];
        query[alias || field] = typecastValue(arg.value);
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

module.exports = getResolver;
