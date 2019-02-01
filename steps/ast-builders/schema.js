'use strict';

var camelCase = require('lodash/string/camelCase');
var map = require('lodash/collection/map');
var b = require('ast-types').builders;
var buildVar = require('./variable');
var buildQuery = require('./query');
var buildQuerys = require('./querys');
var buildFieldWrapperFunction = require('./field-wrapper-function');

module.exports = function(data, opts) {
    var queryFields = [];
    var querysFields = [];
    var querFields;
    if (opts.relay) {
        queryFields.push(b.property(
            'init',
            b.identifier('node'),
            b.identifier('nodeField')
        ));
         querFields=queryFields;  
    } else {
        queryFields = map(data.types, function(type) {
            return b.property(
                'init',
                b.identifier(camelCase(type.name)),
                buildQuery(type, data, opts)
            );
        });
          querysFields = map(data.types, function(type) {
            return b.property(
                'init',
                b.identifier(camelCase(type.name+'s')),
                buildQuerys(type, data, opts)
            );
        });
            queryFields.push.apply(queryFields,querysFields)
    }

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
                            b.property('init', b.identifier('fields'), buildFieldWrapperFunction(
                                'RootQuery',
                                b.objectExpression((queryFields))),
                                opts
                                    )
                            
                        ])]
                    )
                )
            ])]
        )
    );
};
