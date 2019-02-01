'use strict';

var b = require('ast-types').builders;
var buildResolver = require('./resolver');
var buildList = require('./typelist');
var getPrimaryKey = require('../../util/get-primary-key');
var typeMap = {
    string: 'GraphQLString',
    integer: 'GraphQLInt',
    list: 'GraphQLList',
    float: 'GraphQLFloat'
};

module.exports = function buildQuerys(type, data, opts) {
    var model = data.models[type.name];
    var primaryKey = getPrimaryKey(model) || {};
    var keyName = primaryKey.name;
    var keyType = typeMap[primaryKey.type];

    return b.objectExpression([
        b.property('init', b.identifier('type'), buildList(type.varName))
    ].concat(opts.outputDir ? [b.property(
        'init',
        b.identifier('resolve'),
        buildResolver(type)
    )] : []));
};
