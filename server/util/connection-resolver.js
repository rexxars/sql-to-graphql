'use strict';

var resolveMap = require('../resolve-map').resolveMap;
var getSelectionSet = require('./get-selection-set');
var db = require('../db');
var config = require('../config/config');

module.exports = function getConnectionResolver(type) {
    var typeData = resolveMap[type];

    if (!typeData) {
        throw new Error('Type "' + type + '" not a recognized type');
    }

    return function resolveConnection(parent, args, ast) {
        var parentTypeData = resolveMap[ast.parentType.name];
        var listRefField = parentTypeData.listReferences[ast.fieldName];
        var parentPk = parentTypeData.aliases[parentTypeData.primaryKey] || parentTypeData.primaryKey;
        var edgeSelection = ast.fieldASTs[0].selectionSet.selections.reduce(edgeReducer, null);
        var selection = getSelectionSet(type, edgeSelection, typeData.aliases, typeData.referenceMap);
        var clauses = {};
        clauses[listRefField] = parent[parentPk];

        var before = args.before,
            after = args.after,
            first = args.first,
            last = args.last,
            offset = 0,
            limit = config.edgeSize || 25;

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

        var query = db()
            .select(selection)
            .from(typeData.table)
            .where(clauses)
            .offset(offset)
            .limit(limit + 1);

        if (config.debug) {
            console.log(query.toSQL());
        }

        return query.then(function(result) {
            var hasNextPage = result.length > limit;
            if (hasNextPage) {
                result.pop();
            }

            if (result.length === 0) {
                return emptyConnection();
            }

            var startIndex = after ? offset + 1 : offset;
            var edges = result.map(function(value, index) {
                return {
                    cursor: offsetToCursor(startIndex + index),
                    node: value
                };
            });

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
};

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

    var offset = cursorToOffset(cursor);
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
