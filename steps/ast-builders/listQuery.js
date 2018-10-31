'use strict'

var b = require('ast-types').builders
var buildResolver = require('./resolver')
var getPrimaryKey = require('../../util/get-primary-key')
var typeMap = {
  string: 'GraphQLString',
  integer: 'GraphQLInt',
  float: 'GraphQLFloat'
}

module.exports = function buildListQuery(type, data, opts) {
  var model = data.models[type.name]
  var primaryKey = getPrimaryKey(model) || {}
  var keyName = primaryKey.name
  var keyType = typeMap[primaryKey.type]

  /*
  type: new GraphQLList(LocationType),

  resolve: getEntityResolver('Location'),

  args: {
    limit: {
      name: 'limit',
      type: GraphQLInt
    }
  }
*/

  return b.objectExpression([
    b.property('init', b.identifier('type'), b.newExpression(
      b.identifier('GraphQLList'), [
        b.identifier(type.varName)
      ])
    ),
    b.property('init', b.identifier('resolve'), buildResolver(type)),
    b.property('init', b.identifier('args'), b.objectExpression([
      b.property('init', b.identifier('limit'), b.objectExpression([
        b.property('init', b.identifier('name'), b.literal('limit')),
        b.property('init', b.identifier('type'), b.identifier('GraphQLInt'))
      ]))
    ]))
  ])
}
