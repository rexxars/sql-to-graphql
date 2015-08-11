'use strict';

var b = require('ast-types').builders;
var buildExport = require('./exports');

module.exports = function buildExportsQuery() {
    return buildExport(
        b.identifier('schema')
    );
};
