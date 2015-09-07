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

    if (opts.relay && graphql.indexOf('GraphQLList') >= 0) {
        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('getConnectionResolver'),
                    b.callExpression(
                        b.identifier('require'),
                        [b.literal('../util/connection-resolver')]
                    )
                )]
            )
        );
    }

    // Require the resolve map
    declarations.push(
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('resolveMap'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('../resolve-map')]
                )
            )]
        )
    );

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
        );
    }));

    // We need the nodeInterface from the Node type and the globalIdField from relay
    // If we have any list references, we also will need the connection stuff
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

        if (graphql.indexOf('GraphQLList') >= 0) {
            declarations.push(b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('connectionArgs'),
                    b.memberExpression(
                        b.identifier('GraphQLRelay'),
                        b.identifier('connectionArgs'),
                        false
                    )
                )]
            ));
        }
    }

    declarations.push(
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('getType'),
                b.memberExpression(
                    b.identifier('resolveMap'),
                    b.identifier('getType'),
                    false
                )
            )]
        )
    );

    declarations.push(
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('registerType'),
                b.memberExpression(
                    b.identifier('resolveMap'),
                    b.identifier('registerType'),
                    false
                )
            )]
        )
    );

    if (opts.relay && graphql.indexOf('GraphQLList') >= 0) {
        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('getConnection'),
                    b.memberExpression(
                        b.identifier('resolveMap'),
                        b.identifier('getConnection'),
                        false
                    )
                )]
            )
        );
    }

    return declarations;
}

function es6Import(graphql, others, opts) {
    var resolveImports = [
        importSpecifier('getType'),
        importSpecifier('registerType')
    ];

    if (opts.relay && graphql.indexOf('GraphQLList') >= 0) {
        resolveImports.push(importSpecifier('getConnection'));
    }

    var declarations = [
        b.importDeclaration(
            [importSpecifier('getEntityResolver', true)],
            b.literal('../util/entity-resolver')
        )
    ];

    if (opts.relay && graphql.indexOf('GraphQLList') >= 0) {
        declarations.push(
            b.importDeclaration(
                [importSpecifier('getConnectionResolver', true)],
                b.literal('../util/connection-resolver')
            )
        );
    }

    declarations.push(
        b.importDeclaration(
            resolveImports,
            b.literal('../resolve-map')
        )
    );

    declarations.push(b.importDeclaration(
        graphql.map(importSpecifier),
        b.literal('graphql')
    ));

    if (opts.relay) {
        var relayStuff = ['globalIdField'];

        if (graphql.indexOf('GraphQLList') >= 0) {
            relayStuff.push('connectionArgs');
        }

        declarations.push(b.importDeclaration(
            relayStuff.map(function(thing) {
                return importSpecifier(thing);
            }),
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
