'use strict';

var b = require('ast-types').builders;
var uniq = require('lodash/array/uniq');
var merge = require('lodash/object/merge');
var pluck = require('lodash/collection/pluck');
var flatten = require('lodash/array/flatten');
var buildImports = require('./imports');
var buildSchema = require('./schema');
var buildStrict = require('./use-strict');
var buildSchemaExport = require('./exports-schema');

module.exports = function buildSchemaModule(data, opts) {
    var options = merge({ skipLocalImports: !opts.outputDir }, opts);
    var imports = uniq(
        flatten(pluck(data.types, 'imports')).concat(
            pluck(data.types, 'varName')
        )
    );

    var program = []
        .concat(buildStrict(options))
        .concat(buildImports(imports, merge({ isFromSchema: true }, options)))
        .concat([buildSchema(data, options)])
        .concat([buildSchemaExport(data, options)]);

    return b.program(program);
};
