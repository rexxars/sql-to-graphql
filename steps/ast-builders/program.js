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
var buildExportsQuery = require('./exports-query');

module.exports = function buildProgram(data, opts) {
    var options = merge({ skipLocalImports: !opts.outputDir }, opts);
    var imports = uniq(flatten(pluck(data.types, 'imports')));
    var typesAst = pluck(sortBy(data.types, 'imports.length'), 'ast');

    var program = []
        .concat(buildStrict(options))
        .concat(buildImports(imports, options))
        .concat(typesAst)
        .concat([buildSchema(data, options)])
        .concat([buildExportsQuery(data, options)]);

    return b.program(program);
};
