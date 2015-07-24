'use strict';

var b = require('ast-types').builders;
var uniq = require('lodash/array/uniq');
var merge = require('lodash/object/merge');
var sortBy = require('lodash/collection/sortBy');
var pluck = require('lodash/collection/pluck');
var flatten = require('lodash/array/flatten');
var printAst = require('../util/print-ast');
var generateImports = require('../util/generate-imports');

function outputData(data, opts) {
    var options = merge({ skipLocalImports: !opts.outputDir }, opts);
    var imports = uniq(flatten(pluck(data.types, 'imports')));
    var typesAst = pluck(sortBy(data.types, 'imports.length'), 'ast');
    var importsAst = generateImports(imports, options);

    if (!opts.outputDir) {
        return printAst(
            b.program(importsAst.concat(typesAst)),
            options
        );
    }

    // Output to a directory, in other words: split stuff up
    // @todo
}

module.exports = outputData;
