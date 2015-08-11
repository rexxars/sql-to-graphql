'use strict';

var printSchema = require('graphql/utilities/schemaPrinter').printSchema;
var schema = require('../schema');

module.exports = function schemaPrintHandler(request, reply) {
    reply(printSchema(schema));
};
