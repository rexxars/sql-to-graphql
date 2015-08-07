'use strict';

var b = require('ast-types').builders;
var buildExport = require('./exports');

module.exports = function buildExportsQuery() {
    return buildExport(
        b.functionExpression(
            null,
            [b.identifier('query')],
            b.blockStatement([
                b.returnStatement(
                    b.callExpression(
                        b.memberExpression(
                            b.identifier('GraphQL'),
                            b.identifier('graphql'),
                            false
                        ),
                        [
                            b.identifier('schema'),
                            b.identifier('query')
                        ]
                    )
                )
            ])
        )
    );
};
