import { GraphQLList } from 'graphql';
import { resolveMap } from '../resolve-map';
import db from '../db';
import config from '../config/config';

export default function getResolver(type) {
    const typeData = resolveMap[type];

    if (!typeData) {
        throw new Error('Type "' + type + '" not a recognized type');
    }

    const pkAlias = typeData.primaryKey ? typeData.aliases[typeData.primaryKey] : null;
    return function resolveEntity(parent, args, ast) {
        const isList = ast.returnType instanceof GraphQLList;
        const clauses = getClauses(ast, args, typeData.aliases);
        const selection = getSelectionSet(type, ast.fieldASTs[0], typeData.aliases, typeData.referenceMap);
        const hasPkSelected = (
            typeData.primaryKey &&
            selection.some(item => item.indexOf(typeData.primaryKey) === 0)
        );

        if (typeData.primaryKey && !hasPkSelected) {
            selection.unshift(getAliasSelection(typeData.primaryKey, pkAlias));
        }

        if (parent) {
            const parentTypeData = resolveMap[ast.parentType.name];
            const refField = parentTypeData.referenceMap[ast.fieldName];
            const listRefField = parentTypeData.listReferences[ast.fieldName];

            if (refField) {
                const unliasedRef = getUnaliasedName(refField, parentTypeData.aliases);
                clauses[typeData.primaryKey] = parent[refField] || parent[unliasedRef];
            } else if (listRefField) {
                const parentPk = parentTypeData.aliases[parentTypeData.primaryKey] || parentTypeData.primaryKey;
                clauses[listRefField] = parent[parentPk];
            }
        }

        const query = (
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
            if (field || alias) {
                set.push(field || alias);
            }
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

function getClauses(ast, args, aliases) {
    return Object.keys(args).reduce(function(query, alias) {
        if (alias === 'limit' || alias === 'offset') {
            return query;
        }

        let field = getUnaliasedName(alias, aliases);
        query[field || alias] = args[alias];
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
