'use strict';

var b = require('ast-types').builders;
var uniq = require('lodash/uniq');
var flatten = require('lodash/flatten');
var reduce = require('lodash/reduce');
var pluck = require('lodash/map');
var getPrimaryKey = require('../../util/get-primary-key');
var typeMap = {
    string: 'GraphQLString',
    integer: 'GraphQLInt',
    float: 'GraphQLFloat'
};

function generateSchemaImports(data, opts) {
    var imports = [];
    if (!opts.relay) {
        imports = uniq(
            flatten(pluck(data.types, 'imports')).concat(
                pluck(data.types, 'varName')
            )
        );
    }

    var types = imports.filter(not(isGraphQL));
    var graphql = [
        'GraphQLObjectType',
        'GraphQLSchema'
    ];

    if (!opts.relay) {
        graphql = graphql
            .concat(['GraphQLNonNull'])
            .concat(reduceGraphQLTypes(data.models));
    }

    return opts.es6 ?
        es6Import(graphql, types, opts) :
        cjsImport(graphql, types, opts);
}

function reduceGraphQLTypes(models) {
    return reduce(models, function(types, model) {
        var primaryKey = getPrimaryKey(model) || {};
        var keyType = typeMap[primaryKey.type];

        if (keyType && types.indexOf(keyType) === -1) {
            types.push(keyType);
        }

        return types;
    }, []);
}

function cjsImport(graphql, types, opts) {
    var declarations = [
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('getEntityResolver'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('./util/entity-resolver')]
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

    if (opts.relay) {
        declarations.push(b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('Node'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('./types/Node')]
                )
            )]
        ));
    }

    declarations = declarations.concat(types.map(function(item) {
        return b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier(item),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('./types/' + item)]
                )
            )]
        );
    }));

    declarations.push(b.variableDeclaration('var',
        [b.variableDeclarator(
            b.identifier('resolveMap'),
            b.callExpression(
                b.identifier('require'),
                [b.literal('./resolve-map')]
            )
        )]
    ));

    declarations.push(b.variableDeclaration('var',
        [b.variableDeclarator(
            b.identifier('types'),
            b.callExpression(
                b.identifier('require'),
                [b.literal('./types')]
            )
        )]
    ));

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

    if (opts.relay) {
        declarations.push(
            b.variableDeclaration('var',
                [b.variableDeclarator(
                    b.identifier('nodeField'),
                    b.memberExpression(
                        b.identifier('Node'),
                        b.identifier('nodeField'),
                        false
                    )
                )]
            )
        );
    }

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

    return declarations;
}

function es6Import(graphql, types, opts) {
    var declarations = [
        b.importDeclaration(
            [importSpecifier('getEntityResolver', true)],
            b.literal('./util/entity-resolver')
        )
    ];

    if (graphql.length) {
        declarations.push(b.importDeclaration(
            graphql.map(importSpecifier),
            b.literal('graphql')
        ));
    }

    if (opts.relay && opts.isFromSchema) {
        declarations.push(b.importDeclaration(
            [importSpecifier('nodeField')],
            b.literal('./types/Node')
        ));
    }

    declarations = declarations.concat(
        types.map(function(item) {
            return b.importDeclaration(
                [importSpecifier(item, true)],
                b.literal('./types/' + item)
            );
        })
    );

    declarations.push(b.importDeclaration(
        [importSpecifier('registerType')],
        b.literal('./resolve-map')
    ));

    declarations.push(b.importDeclaration(
        [{
            type: 'ImportNamespaceSpecifier',
            id: {
                type: 'Identifier',
                name: 'types'
            }
        }],
        b.literal('./types')
    ));

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

function isGraphQL(name) {
    return name.indexOf('GraphQL') === 0;
}

function not(fn) {
    return function(item) {
        return !fn(item);
    };
}

module.exports = generateSchemaImports;
