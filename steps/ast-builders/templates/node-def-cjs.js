'use strict';

var relay = require('graphql-relay');
var getEntityResolver = require('../util/entity-resolver');

var nodeDefinitions = relay.nodeDefinitions;
var fromGlobalId = relay.fromGlobalId;

var node = nodeDefinitions(
    function(globalId, ast) {
        var gid = fromGlobalId(globalId);
        return getEntityResolver(gid.type)(null, { id: gid.id }, ast);
    },
    function(data) {
        return data.__type;
    }
);

exports.nodeInterface = node.nodeInterface;
exports.nodeField = node.nodeField;
