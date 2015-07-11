'use strict';

function isNullable(col) {
    return col.isNullable === 'YES';
}

module.exports = isNullable;
