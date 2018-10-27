'use strict';

var b = require('ast-types').builders;
var buildStrict = require('./use-strict');
var pluck = require('lodash/map');
var buildExports = require('./exports');

module.exports = function buildTypeIndex(data, opts) {
    var types = pluck(data.types, 'varName');
    var theImports = types.map(opts.es6 ? es6Import : cjsImport);
    var theExports = (opts.es6 ? es6Export : cjsExport)(types);

    var program = []
        .concat(buildStrict(opts))
        .concat(theImports)
        .concat(theExports);

    return b.program(program);
};

function cjsImport(type) {
    return b.variableDeclaration('var',
        [b.variableDeclarator(
            b.identifier(type),
            b.callExpression(
                b.identifier('require'),
                [b.literal('./' + type)]
            )
        )]
    );
}

function es6Import(type) {
    return b.importDeclaration(
        [{
            type: 'ImportDefaultSpecifier',
            id: {
                type: 'Identifier',
                name: type
            },
            name: null
        }],
        b.literal('./' + type)
    );
}

function es6Export(types) {
    return {
        type: 'ExportDeclaration',
        default: false,
        declaration: null,
        specifiers: types.map(function(type) {
            return {
                type: 'ExportSpecifier',
                id: {
                    type: 'Identifier',
                    name: type
                },
                name: null
            };
        })
    };
}

function cjsExport(types) {
    return buildExports(b.objectExpression(types.map(function(type) {
        return b.property('init', b.literal(type), b.identifier(type));
    })), { es6: false });
}
