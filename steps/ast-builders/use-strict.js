'use strict';

var b = require('ast-types').builders;

module.exports = function buildStrict(options) {
    if (options.es6) {
        return [];
    }

    return b.expressionStatement(
        b.literal('use strict')
    );
};
