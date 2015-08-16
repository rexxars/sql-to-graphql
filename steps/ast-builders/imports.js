'use strict';

var b = require('ast-types').builders;

function generateImports(imports, opts) {
    var others = imports.filter(not(isGraphQL));
    var graphql = [
        'GraphQLObjectType',
        'GraphQLSchema'
    ].concat(imports.filter(isGraphQL));

    return opts.es6 ?
        es6Import(graphql, others, opts) :
        cjsImport(graphql, others, opts);
}

function cjsImport(graphql, others, opts) {
    var resolverPath = (opts.outputDir && !opts.isFromSchema ? '.' : '') + './util/entity-resolver';
    var declarations = [
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('getEntityResolver'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal(resolverPath)]
                )
            )]
        )
    ];

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
    }

    if (opts.relay && opts.isFromSchema) {
        declarations.push(b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('GraphRelay'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('graphql-relay')]
                )
            )]
        ));
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

    if (opts.relay && opts.isFromSchema) {
        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('globalIdField'),
                    b.memberExpression(
                        b.identifier('GraphRelay'),
                        b.identifier('globalIdField'),
                        false
                    )
                )]
            )
        );
    }

    return declarations;
}

function es6Import(graphql, others, opts) {
    var resolverPath = (opts.outputDir && !opts.isFromSchema ? '.' : '') + './util/entity-resolver';
    var declarations = [
        b.importDeclaration(
            [importSpecifier('getEntityResolver', true)],
            b.literal(resolverPath)
        )
    ];

    if (graphql.length) {
        declarations.push(b.importDeclaration(
            graphql.map(function(item) {
                return importSpecifier(item);
            }),
            b.literal('graphql')
        ));
    }

    if (opts.relay && opts.isFromSchema) {
        declarations.push(b.importDeclaration(
            [importSpecifier('globalIdField')],
            b.literal('graphql-relay')
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
function importSpecifier(name, def) {
    return {
        type: def ? 'ImportDefaultSpecifier' : 'ImportSpecifier',
        id: {
            type: 'Identifier',
            name: name
        },
        name: null
    };
}

function importDeclaration(item, opts) {
    return b.importDeclaration(
        [importSpecifier(item, true)],
        b.literal(importPath(item, opts))
    );
}

function importPath(item, opts) {
    var path = opts.isFromSchema ? 'types/' : '';
    return './' + path + item;
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
