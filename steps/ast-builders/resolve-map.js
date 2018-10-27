'use strict';

var b = require('ast-types').builders;
var reduce = require('lodash/reduce');
var buildObject = require('./object');
var buildStrict = require('./use-strict');
var buildVariable = require('./variable');
var getPrimaryKey = require('../../util/get-primary-key');

module.exports = function buildResolveMap(data, opts) {
    var map = getResolveMap(data.models, opts);

    var program = []
        .concat(buildStrict(opts))
        .concat(buildImports(opts))
        .concat(buildResolveMapExport(map, opts))
        .concat(buildConnectionsVar(opts))
        .concat(buildExportedFunc(opts, getTypeRegisterAst(), 'registerType'))
        .concat(buildExportedFunc(opts, getTypeGetterAst(), 'getType'));

    if (opts.relay) {
        program = program.concat(buildExportedFunc(
            opts,
            getConnectionGetterAst(opts),
            'getConnection'
        ));
    }

    return b.program(program);
};

function getResolveMap(models, opts) {
    var resolveMap = {};
    for (var type in models) {
        resolveMap[models[type].name] = getTypeResolver(models[type], opts);
    }

    return buildObject(resolveMap, opts);
}

function getTypeResolver(model) {
    return {
        name: model.name,
        table: model.table,
        primaryKey: getPrimaryKeyArg(model),
        aliases: model.aliasedFields,
        referenceMap: getRefFieldMapArg(model),
        listReferences: getListRefFieldMapArg(model)
    };
}

function getListRefFieldMapArg(model) {
    return reduce(model.listReferences, buildReferenceMap, {});
}

function getRefFieldMapArg(model) {
    return reduce(model.references, buildReferenceMap, {});
}

function getPrimaryKeyArg(model) {
    var primaryKey = getPrimaryKey(model);
    return primaryKey ? primaryKey.originalName : null;
}

function buildReferenceMap(refMap, reference) {
    refMap[reference.field] = reference.refField;
    return refMap;
}

function buildResolveMapExport(map, opts) {
    if (opts.es6) {
        return [b.exportDeclaration(false, buildVariable('resolveMap', map, opts.es6))];
    }

    return [
        buildVariable('resolveMap', map, opts.es6),
        b.expressionStatement(
            b.assignmentExpression(
                '=',
                b.memberExpression(
                    b.identifier('exports'),
                    b.identifier('resolveMap'),
                    false
                ),
                b.identifier('resolveMap')
            )
        )
    ];
}

function buildExportedFunc(opts, ast, name) {
    var func = (opts.es6 ? b.functionDeclaration : b.functionExpression)(
        b.identifier(name),
        [b.identifier('type')],
        b.blockStatement(ast)
    );

    if (opts.es6) {
        return [b.exportDeclaration(false, func)];
    }

    return [
        b.expressionStatement(b.assignmentExpression(
            '=',
            b.memberExpression(
                b.identifier('exports'),
                b.identifier(name),
                false
            ),
            func
        ))
    ];
}

function buildConnectionsVar(opts) {
    if (!opts.relay) {
        return [];
    }

    return [buildVariable('connections', b.objectExpression([]), opts.es6)];
}

function buildImports(opts) {
    if (!opts.relay) {
        return [];
    }

    if (opts.es6) {
        return [
            b.importDeclaration(
                [importSpecifier('connectionDefinitions')],
                b.literal('graphql-relay')
            )
        ];
    }

    return [
        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('GraphQLRelay'),
                b.callExpression(
                    b.identifier('require'),
                    [b.literal('graphql-relay')]
                )
            )]
        ),

        b.variableDeclaration('var',
            [b.variableDeclarator(
                b.identifier('connectionDefinitions'),
                b.memberExpression(
                    b.identifier('GraphQLRelay'),
                    b.identifier('connectionDefinitions'),
                    false
                )
            )]
        )
    ];
}

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

/* eslint quote-props: 0 */

// Can't be bothered trying replicate this with the builder right now :x
// On a totally unrelated side-note, someone should make a thing that takes
// AST and generates code that can build it with the `ast-types` builder
// Then you would be able to easily make parts of it dynamic etc. Much like
// this project, I guess.
function getTypeRegisterAst() {
    return [
        {
            'type': 'IfStatement',
            'test': {
                'type': 'UnaryExpression',
                'operator': '!',
                'argument': {
                    'type': 'MemberExpression',
                    'computed': true,
                    'object': {
                        'type': 'Identifier',
                        'name': 'resolveMap'
                    },
                    'property': {
                        'type': 'MemberExpression',
                        'computed': false,
                        'object': {
                            'type': 'Identifier',
                            'name': 'type'
                        },
                        'property': {
                            'type': 'Identifier',
                            'name': 'name'
                        }
                    }
                },
                'prefix': true
            },
            'consequent': {
                'type': 'BlockStatement',
                'body': [
                    {
                        'type': 'ThrowStatement',
                        'argument': {
                            'type': 'NewExpression',
                            'callee': {
                                'type': 'Identifier',
                                'name': 'Error'
                            },
                            'arguments': [
                                {
                                    'type': 'BinaryExpression',
                                    'operator': '+',
                                    'left': {
                                        'type': 'BinaryExpression',
                                        'operator': '+',
                                        'left': {
                                            'type': 'Literal',
                                            'value': 'Cannot register type "'
                                        },
                                        'right': {
                                            'type': 'MemberExpression',
                                            'computed': false,
                                            'object': {
                                                'type': 'Identifier',
                                                'name': 'type'
                                            },
                                            'property': {
                                                'type': 'Identifier',
                                                'name': 'name'
                                            }
                                        }
                                    },
                                    'right': {
                                        'type': 'Literal',
                                        'value': '" - resolve map does not exist for that type'
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            'alternate': null
        },
        {
            'type': 'ExpressionStatement',
            'expression': {
                'type': 'AssignmentExpression',
                'operator': '=',
                'left': {
                    'type': 'MemberExpression',
                    'computed': false,
                    'object': {
                        'type': 'MemberExpression',
                        'computed': true,
                        'object': {
                            'type': 'Identifier',
                            'name': 'resolveMap'
                        },
                        'property': {
                            'type': 'MemberExpression',
                            'computed': false,
                            'object': {
                                'type': 'Identifier',
                                'name': 'type'
                            },
                            'property': {
                                'type': 'Identifier',
                                'name': 'name'
                            }
                        }
                    },
                    'property': {
                        'type': 'Identifier',
                        'name': 'type'
                    }
                },
                'right': {
                    'type': 'Identifier',
                    'name': 'type'
                }
            }
        }
    ];
}

function getTypeGetterAst() {
    return [{
        'type': 'IfStatement',
        'test': {
            'type': 'LogicalExpression',
            'operator': '||',
            'left': {
                'type': 'UnaryExpression',
                'operator': '!',
                'argument': {
                    'type': 'MemberExpression',
                    'computed': true,
                    'object': {
                        'type': 'Identifier',
                        'name': 'resolveMap'
                    },
                    'property': {
                        'type': 'Identifier',
                        'name': 'type'
                    }
                },
                'prefix': true
            },
            'right': {
                'type': 'UnaryExpression',
                'operator': '!',
                'argument': {
                    'type': 'MemberExpression',
                    'computed': false,
                    'object': {
                        'type': 'MemberExpression',
                        'computed': true,
                        'object': {
                            'type': 'Identifier',
                            'name': 'resolveMap'
                        },
                        'property': {
                            'type': 'Identifier',
                            'name': 'type'
                        }
                    },
                    'property': {
                        'type': 'Identifier',
                        'name': 'type'
                    }
                },
                'prefix': true
            }
        },
        'consequent': {
            'type': 'BlockStatement',
            'body': [
                {
                    'type': 'ThrowStatement',
                    'argument': {
                        'type': 'NewExpression',
                        'callee': {
                            'type': 'Identifier',
                            'name': 'Error'
                        },
                        'arguments': [
                            {
                                'type': 'BinaryExpression',
                                'operator': '+',
                                'left': {
                                    'type': 'BinaryExpression',
                                    'operator': '+',
                                    'left': {
                                        'type': 'Literal',
                                        'value': 'No type registered for type \''
                                    },
                                    'right': {
                                        'type': 'Identifier',
                                        'name': 'type'
                                    }
                                },
                                'right': {
                                    'type': 'Literal',
                                    'value': '\''
                                }
                            }
                        ]
                    }
                }
            ]
        },
        'alternate': null
    },
    {
        'type': 'ReturnStatement',
        'argument': {
            'type': 'MemberExpression',
            'computed': false,
            'object': {
                'type': 'MemberExpression',
                'computed': true,
                'object': {
                    'type': 'Identifier',
                    'name': 'resolveMap'
                },
                'property': {
                    'type': 'Identifier',
                    'name': 'type'
                }
            },
            'property': {
                'type': 'Identifier',
                'name': 'type'
            }
        }
    }];
}

function getConnectionGetterAst(opts) {
    return [
        {
            'type': 'IfStatement',
            'test': {
                'type': 'UnaryExpression',
                'operator': '!',
                'argument': {
                    'type': 'MemberExpression',
                    'computed': true,
                    'object': {
                        'type': 'Identifier',
                        'name': 'connections'
                    },
                    'property': {
                        'type': 'Identifier',
                        'name': 'type'
                    }
                },
                'prefix': true
            },
            'consequent': {
                'type': 'BlockStatement',
                'body': [
                    {
                        'type': 'ExpressionStatement',
                        'expression': {
                            'type': 'AssignmentExpression',
                            'operator': '=',
                            'left': {
                                'type': 'MemberExpression',
                                'computed': true,
                                'object': {
                                    'type': 'Identifier',
                                    'name': 'connections'
                                },
                                'property': {
                                    'type': 'Identifier',
                                    'name': 'type'
                                }
                            },
                            'right': {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                    'type': 'CallExpression',
                                    'callee': {
                                        'type': 'Identifier',
                                        'name': 'connectionDefinitions'
                                    },
                                    'arguments': [
                                        {
                                            'type': 'ObjectExpression',
                                            'properties': [
                                                {
                                                    'type': 'Property',
                                                    'key': {
                                                        'type': 'Identifier',
                                                        'name': 'name'
                                                    },
                                                    'value': {
                                                        'type': 'Identifier',
                                                        'name': 'type'
                                                    },
                                                    'kind': 'init',
                                                    'method': false,
                                                    'shorthand': false,
                                                    'computed': false
                                                },
                                                {
                                                    'type': 'Property',
                                                    'key': {
                                                        'type': 'Identifier',
                                                        'name': 'nodeType'
                                                    },
                                                    'value': {
                                                        'type': 'CallExpression',
                                                        'callee': opts.es6 ? {
                                                            'type': 'Identifier',
                                                            'name': 'getType'
                                                        } : {
                                                            'type': 'MemberExpression',
                                                            'computed': false,
                                                            'object': {
                                                                'type': 'Identifier',
                                                                'name': 'exports'
                                                            },
                                                            'property': {
                                                                'type': 'Identifier',
                                                                'name': 'getType'
                                                            }
                                                        },
                                                        'arguments': [
                                                            {
                                                                'type': 'Identifier',
                                                                'name': 'type'
                                                            }
                                                        ]
                                                    },
                                                    'kind': 'init',
                                                    'method': false,
                                                    'shorthand': false,
                                                    'computed': false
                                                }
                                            ]
                                        }
                                    ]
                                },
                                'property': {
                                    'type': 'Identifier',
                                    'name': 'connectionType'
                                }
                            }
                        }
                    }
                ]
            },
            'alternate': null
        },
        {
            'type': 'ReturnStatement',
            'argument': {
                'type': 'MemberExpression',
                'computed': true,
                'object': {
                    'type': 'Identifier',
                    'name': 'connections'
                },
                'property': {
                    'type': 'Identifier',
                    'name': 'type'
                }
            }
        }
    ];
}
