import { GraphQLList } from 'graphql';
import db from '../db';

export default function getResolver(opts) {
    const pkAlias = opts.primaryKey ? opts.aliases[opts.primaryKey] : null;
    return function resolveEntity(parent, args, src, ast, type) {
        const isList = type instanceof GraphQLList;
        const clauses = getClauses(ast, opts.aliases);
        const selection = getSelectionSet(type, ast, opts.aliases, opts.referenceMap);
        const hasPkSelected = (
            opts.primaryKey &&
            selection.some(item => item.indexOf(opts.primaryKey) === 0)
        );

        if (opts.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(opts.primaryKey, pkAlias));
        }

        if (parent && opts.reference) {
            clauses[opts.reference] = parent[opts.reference];
        }

        const query = (
            isList ? db().select(selection) : db().first(selection)
        ).from(opts.table).where(clauses);

        return query;
    };
}

function getSelectionSet(type, ast, aliases, referenceMap) {
    return ast.selectionSet.selections.reduce(function reduceSelectionSet(set, selection) {

        // If we encounter a selection with a type condition, make sure it's the correct type
        if (selection.typeCondition && selection.typeCondition.name.value !== type) {
            return set;
        }

        let alias, field;
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
    return ast.arguments.reduce(function reduceClause(query, arg) {
        let alias = arg.name.value;
        let field = getUnaliasedName(alias, aliases);
        query[field || alias] = typecastValue(arg.value);
        return query;
    }, {});
}

function typecastValue(value) {
    const val = value.value;
    switch (value.kind) {
        case 'IntValue':
            return parseInt(val, 10);
        default:
            return val;
    }
}

function getUnaliasedName(alias, aliases) {
    for (let key in aliases) {
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
