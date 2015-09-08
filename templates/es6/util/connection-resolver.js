import { resolveMap } from '../resolve-map';
import getSelectionSet from './get-selection-set';
import db from '../db';
import config from '../config/config';

export default function getConnectionResolver(type) {
    const typeData = resolveMap[type];

    if (!typeData) {
        throw new Error('Type "' + type + '" not a recognized type');
    }

    return function resolveConnection(parent, args, ast) {
        const parentTypeData = resolveMap[ast.parentType.name];
        const listRefField = parentTypeData.listReferences[ast.fieldName];
        const parentPk = parentTypeData.aliases[parentTypeData.primaryKey] || parentTypeData.primaryKey;
        const edgeSelection = ast.fieldASTs[0].selectionSet.selections.reduce(edgeReducer, null);
        const selection = getSelectionSet(type, edgeSelection, typeData.aliases, typeData.referenceMap);
        const clauses = { [listRefField]: parent[parentPk] };

        const {before, after, first, last} = args;
        let offset = 0, limit = config.edgeSize || 25;

        if (before && after) {
            throw new Error('Combining `before` and `after` is not supported');
        }

        if (after) {
            offset = getOffset(after) || 0;
            limit = parseInt(first || config.edgeSize || 25, 10);
        } else if (before) {
            limit = parseInt(last || config.edgeSize || 25, 10);
            offset = Math.max(0, (getOffset(before) || 0) - limit);
        }

        const query = db()
            .select(selection)
            .from(typeData.table)
            .where(clauses)
            .offset(offset)
            .limit(limit + 1);

        if (config.debug) {
            console.log(query.toSQL());
        }

        return query.then(function(result) {
            let hasNextPage = result.length > limit;
            if (hasNextPage) {
                result.pop();
            }

            if (result.length === 0) {
                return emptyConnection();
            }

            let startIndex = after ? offset + 1 : offset;
            let edges = result.map(
                (value, index) => ({
                    cursor: offsetToCursor(startIndex + index),
                    node: value
                })
            );

            if (first) {
                edges = edges.slice(0, first);
            }

            if (last) {
                edges = edges.slice(-last);
            }

            if (edges.length === 0) {
                return emptyConnection();
            }

            return {
                edges: edges,
                pageInfo: {
                    startCursor: edges[0].cursor,
                    endCursor: edges[edges.length - 1].cursor,
                    hasPreviousPage: cursorToOffset(edges[0].cursor) > 0,
                    hasNextPage: hasNextPage
                }
            };
        });
    };
}

var PREFIX = 'Connection:';
function offsetToCursor(offset) {
    return new Buffer(PREFIX + offset).toString('base64');
}

function cursorToOffset(cursor) {
    return parseInt(new Buffer(cursor, 'base64').toString('ascii').substring(PREFIX.length), 10);
}

// Given an optional cursor and a default offset, returns the offset
// to use; if the cursor contains a valid offset, that will be used,
// otherwise it will be the default.
function getOffset(cursor, defaultOffset) {
    if (typeof cursor === 'undefined' || cursor === null) {
        return defaultOffset;
    }

    let offset = cursorToOffset(cursor);
    if (isNaN(offset)) {
        return defaultOffset;
    }

    return offset;
}

function emptyConnection() {
    return {
        edges: [],
        pageInfo: {
            startCursor: null,
            endCursor: null,
            hasPreviousPage: false,
            hasNextPage: false
        }
    };
}

function edgeReducer(edges, selection) {
    if (selection.name.value !== 'edges') {
        return edges;
    }

    return selection.selectionSet.selections.reduce(nodeReducer);
}

function nodeReducer(node, selection) {
    if (selection.name.value !== 'node') {
        return node;
    }

    return selection;
}
