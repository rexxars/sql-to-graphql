'use strict';

var b = require('ast-types').builders;
var uniq = require('lodash/array/uniq');
var merge = require('lodash/object/merge');
var sortBy = require('lodash/collection/sortBy');
var pluck = require('lodash/collection/pluck');
var flatten = require('lodash/array/flatten');
var buildImports = require('./imports');
var buildSchema = require('./schema');
var buildStrict = require('./use-strict');
var buildSchemaExport = require('./exports-schema');
var buildNodeDefs = require('./node-definitions');

module.exports = function buildProgram(data, opts) {
    var options = merge({ skipLocalImports: !opts.outputDir }, opts);
    var imports = uniq(flatten(pluck(data.types, 'imports')));
    var typesAst = pluck(sortBy(data.types, 'imports.length'), 'ast');
    var nodeDefs = opts.relay ? buildNodeDefs(opts) : [];
    var beforeExport = [];

    if (opts.relay) {
        var typeVars = pluck(data.types, 'varName').map(b.identifier);
        beforeExport = [b.expressionStatement(b.callExpression(
            b.memberExpression(b.arrayExpression(typeVars), b.identifier('forEach'), false),
            [b.identifier('registerType')]
        ))];
    }

    var program = []
        .concat(buildStrict(options))
        .concat(buildImports(imports, options))
        .concat(nodeDefs)
        .concat(typesAst)
        .concat([buildSchema(data, options)])
        .concat(beforeExport)
        .concat([buildSchemaExport(options)]);

    return b.program(program);
};
