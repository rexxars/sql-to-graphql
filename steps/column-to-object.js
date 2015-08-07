'use strict';

var merge = require('lodash/object/merge');
var indexBy = require('lodash/collection/indexBy');
var camelCase = require('lodash/string/camelCase');
var capitalize = require('lodash/string/capitalize');
var generics = ['type'], undef;

function columnToObject(col, opts) {
    var column = merge({
        name: getColName(col, opts),
        originalName: col.columnName,
        description: col.columnComment || undef,
        isNullable: col.isNullable === 'YES',
        isPrimaryKey: col.columnKey === 'PRI'
    }, getType(col));

    if (column.isPrimaryKey && !opts.unaliasedPrimaryKeys) {
        column.name = 'id';
    }

    return column;
}

function getColName(col) {
    if (generics.indexOf(col.columnName.toLowerCase()) > -1) {
        return camelCase(col.tableName) + capitalize(camelCase(col.columnName));
    }

    return camelCase(col.columnName);
}

function getEnumValueMap(col) {
    var values = col.columnType
        .replace(/^enum\((.*)\)/, '$1')
        .split(',')
        .map(unquote)
        .map(function(val) {
            return {
                value: val,
                description: undef
            };
        });

    return indexBy(values, 'value');
}

function unquote(str) {
    return str.replace(/^'+|'+$/g, '');
}

function getType(col) {
    switch (col.dataType) {
        // Dates represented as strings
        case 'time':
        case 'date':
        case 'datetime':

        // Buffers represented as strings
        case 'bit':
        case 'blob':
        case 'tinyblob':
        case 'longblob':
        case 'mediumblob':
        case 'binary':
        case 'varbinary':

        // Numbers that may exceed float precision, repesent as string
        case 'decimal':
        case 'bigint':
        case 'geometry':

        // Strings
        case 'set':
        case 'char':
        case 'text':
        case 'varchar':
        case 'tinytext':
        case 'longtext':
        case 'mediumtext':
            return { type: 'string' };

        // Integers
        case 'int':
        case 'year':
        case 'tinyint':
        case 'smallint':
        case 'mediumint':
        case 'timestamp':
            return { type: 'integer' };

        // Floats
        case 'float':
        case 'double':
            return { type: 'float' };

        // Enum special case
        case 'enum':
            return {
                type: 'enum',
                values: getEnumValueMap(col)
            };
        default:
            throw new Error('Type "' + col.dataType + '" not recognized');
    }
}

module.exports = columnToObject;
