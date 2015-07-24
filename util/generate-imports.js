'use strict';

var b = require('ast-types').builders;
var path = require('path');

function generateImports(imports, opts) {
    var graphql = ['GraphQLObjectType'].concat(imports.filter(isGraphQL));
    var others = imports.filter(not(isGraphQL));

    return (
        opts.es6 ?
        es6Import(graphql, others, opts) :
        cjsImport(graphql, others, opts)
    );
}

function cjsImport(graphql, others, opts) {
    var declarations = [];

    if (graphql.length) {
        declarations.push(b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('GraphQL'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('graphql')]
                )
            )]
        ));

        graphql.forEach(function(item) {
            declarations.push(
                b.variableDeclaration('var',
                    [b.variableDeclarator(
                        b.identifier(item),
                        b.memberExpression(
                            b.identifier('GraphQL'),
                            b.identifier(item),
                            false
                        )
                    )]
                ));
        });
    }

    if (others.length && !opts.skipLocalImports) {
        others.forEach(function(item) {
            declarations.push(
                b.variableDeclaration('var',
                    [b.variableDeclarator(
                        b.identifier(item),
                        b.callExpression(
                            b.identifier('require'),
                            [b.literal(importPath(item, opts))]
                        )
                    )]
                ));
        });
    }

    return declarations;
}

function es6Import(graphql, others, opts) {
    var declarations = [];
    if (graphql.length) {
        declarations.push(b.importDeclaration(
            graphql.map(importSpecifier),
            b.literal('graphql')
        ));
    }

    if (others.length && !opts.skipLocalImports) {
        declarations = declarations.concat(
            others.map(function(item) {
                return importDeclaration(item, opts);
            })
        );
    }

    return declarations;
}

// Couldn't figure out b.importSpecifier
function importSpecifier(name) {
    return {
        type: 'ImportSpecifier',
        id: {
            type: 'Identifier',
            name: name
        },
        name: null
    };
}

function importDeclaration(item, opts) {
    return b.importDeclaration(
        [importSpecifier(item)],
        b.literal(importPath(item, opts))
    );
}

function importPath(item, opts) {
    return path.join(opts.outputDir, 'types', item);
}

function isGraphQL(name) {
    return name.indexOf('GraphQL') === 0;
}

function not(fn) {
    return function(item) {
        return !fn(item);
    };
}

module.exports = generateImports;
