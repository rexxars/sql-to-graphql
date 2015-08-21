'use strict';

var b = require('ast-types').builders;
var buildSchema = require('./schema');
var buildStrict = require('./use-strict');
var buildSchemaExport = require('./exports-schema');
var buildSchemaImports = require('./schema-imports');
var buildTypeRegistration = require('./type-registration-loop');

module.exports = function buildSchemaModule(data, opts) {
    var program = []
        .concat(buildStrict(opts))
        .concat(buildSchemaImports(data, opts))
        .concat([buildSchema(data, opts)])
        .concat([buildTypeRegistration(opts)])
        .concat([buildSchemaExport(data, opts)]);

    return b.program(program);
};
