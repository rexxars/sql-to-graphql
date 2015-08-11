'use strict';

var b = require('ast-types').builders;
var buildExport = require('./exports');

module.exports = function buildExportsQuery(opts) {
    return buildExport(
        b.identifier('schema'),
        opts
    );
};
