'use strict'

var camelCase = require('lodash/camelCase')
var pluralize = require('pluralize')
var map = require('lodash/map')
var b = require('ast-types').builders
var buildVar = require('./variable')
var buildQuery = require('./query')
var buildListQuery = require('./listQuery')
var buildFieldWrapperFunction = require('./field-wrapper-function')

module.exports = function (data, opts) {
  var queryFields = []
  var listQueryFields = []
  if (opts.relay) {
    queryFields.push(
      b.property('init', b.identifier('node'), b.identifier('nodeField'))
    )
  } else {
    queryFields = map(data.types, function (type) {
      return b.property(
        'init',
        b.identifier(camelCase(type.name)),
        buildQuery(type, data, opts)
      )
    })
    listQueryFields = map(data.types, function (type) {
      return b.property(
        'init',
        b.identifier(pluralize(camelCase(type.name))),
        buildListQuery(type, data, opts)
      )
    })
  }

  var allQueryFields = queryFields.concat(listQueryFields)
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
                b.objectExpression(allQueryFields),
                opts
              ))
            ])]
          )
        )
      ])]
    )
  );
};
