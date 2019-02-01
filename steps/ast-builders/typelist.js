'use strict';

var b = require('ast-types').builders;

module.exports = function buildList(type) {
    return b.callExpression(
        b.identifier('new GraphQL.GraphQLList'),
        [ b.identifier(type)]//[b.literal(type)]
    );
};
