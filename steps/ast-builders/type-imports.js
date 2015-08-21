'use strict';

var b = require('ast-types').builders;

function buildTypeImports(type, opts) {
    var imports = type.imports;
    var others = imports.filter(not(isGraphQL));
    var graphql = ['GraphQLObjectType'].concat(imports.filter(isGraphQL));

    return opts.es6 ?
        es6Import(graphql, others, opts) :
        cjsImport(graphql, others, opts);
}

function cjsImport(graphql, others, opts) {
    // Require the entity resolver
    var declarations = [
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('getEntityResolver'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('../util/entity-resolver')]
                )
            )]
        )
    ];

    // Require the graphql library
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

    // Relay needs the Node interface along with the globalIdField
    if (opts.relay) {
        declarations.push(b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('GraphQLRelay'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('graphql-relay')]
                )
            )]
        ));

        declarations.push(b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('Node'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('./Node')]
                )
            )]
        ));
    }

    // Other types
    declarations = declarations.concat(others.map(function(item) {
        return b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier(item),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('./' + item)]
                )
            )]
        );
    }));

    // Declare local variables for the different GraphQL types
    declarations = declarations.concat(graphql.map(function(item) {
        return b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier(item),
                b.memberExpression(
                    b.identifier('GraphQL'),
                    b.identifier(item),
                    false
                )
            )]
        )
    }));

    // We need the nodeInterface from the Node type and the globalIdField from relay
    if (opts.relay) {
        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('nodeInterface'),
                    b.memberExpression(
                        b.identifier('Node'),
                        b.identifier('nodeInterface'),
                        false
                    )
                )]
            )
        );

        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('globalIdField'),
                    b.memberExpression(
                        b.identifier('GraphQLRelay'),
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
    var declarations = [
        b.importDeclaration(
            [importSpecifier('getEntityResolver', true)],
            b.literal('../util/entity-resolver')
        )
    ];

    declarations.push(b.importDeclaration(
        graphql.map(importSpecifier),
        b.literal('graphql')
    ));

    if (opts.relay) {
        declarations.push(b.importDeclaration(
            [importSpecifier('globalIdField')],
            b.literal('graphql-relay')
        ));

        declarations.push(b.importDeclaration(
            [importSpecifier('nodeInterface')],
            b.literal('./Node')
        ));
    }

    declarations = declarations.concat(
        others.map(function(item) {
            return importDeclaration(item, opts);
        })
    );

    return declarations;
}

// Couldn't figure out b.importSpecifier
function importSpecifier(name, def) {
    return {
        type: def === true ? 'ImportDefaultSpecifier' : 'ImportSpecifier',
        id: {
            type: 'Identifier',
            name: name
        },
        name: null
    };
}

function importDeclaration(item) {
    return b.importDeclaration(
        [importSpecifier(item, true)],
        b.literal('./' + item)
    );
}

function isGraphQL(name) {
    return name.indexOf('GraphQL') === 0;
}

function not(fn) {
    return function(item) {
        return !fn(item);
    };
}

module.exports = buildTypeImports;
