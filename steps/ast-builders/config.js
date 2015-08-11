'use strict';

var b = require('ast-types').builders;
var buildObject = require('./object');
var buildStrict = require('./use-strict');
var buildExports = require('./exports');

module.exports = function buildConfig(opts) {
    var program = []
        .concat(buildStrict(opts))
        .concat([buildExports(getConfigAst(opts), opts)]);

    return b.program(program);
};

function getConfigAst(opts) {
    return b.objectExpression([
        b.property('init', b.identifier('client'), b.literal(opts.backend)),
        b.property('init', b.identifier('connection'), buildObject({
            host: opts.host,
            user: opts.user,
            password: opts.password,
            database: opts.db
        }))
    ]);
}
