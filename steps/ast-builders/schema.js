'use strict';

var camelCase = require('lodash/string/camelCase');
var map = require('lodash/collection/map');
var b = require('ast-types').builders;
var buildVar = require('./variable');
var buildQuery = require('./query');

module.exports = function(data, opts) {
    return buildVar('schema',
        b.newExpression(
            b.identifier('GraphQLSchema'),
            [b.objectExpression([
                b.property(
                    'init',
                    b.identifier('query'),
                    b.newExpression(
                        b.identifier('GraphQLObjectType'),
                        [b.objectExpression([
                            b.property('init', b.identifier('name'), b.literal('RootQueryType')),
                            b.property('init', b.identifier('fields'), b.objectExpression(
                                map(data.types, function(type) {
                                    return b.property(
                                        'init',
                                        b.identifier(camelCase(type.name)),
                                        buildQuery(type, data, opts)
                                    );
                                })
                            ))
                        ])]
                    )
                )
            ])]
        )
    );
};
