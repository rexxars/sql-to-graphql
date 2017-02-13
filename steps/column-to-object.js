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
        .replace(/^\{|\}$/g, '')
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
        // pg
        case 'timestamp with time zone':

        // Buffers represented as strings
        case 'bit':
        case 'blob':
        case 'tinyblob':
        case 'longblob':
        case 'mediumblob':
        case 'binary':
        case 'varbinary':

        // Numbers that may exceed float precision, repesent as string
        case 'bigint':
        case 'decimal':
        case 'numeric':
        case 'geometry':
        case 'bigserial':

        // Network addresses represented as strings
        case 'cidr':
        case 'inet':
        case 'macaddr':

        // Strings
        case 'set':
        case 'char':
        case 'text':
        case 'uuid':
        case 'varchar':
        case 'nvarchar':
        case 'tinytext':
        case 'longtext':
        case 'character':
        case 'mediumtext':
        // pg
        case 'character varying':
        case 'jsonb':
            return { type: 'string' };

        // Integers
        case 'int':
        case 'year':
        case 'serial':
        case 'integer':
        case 'tinyint':
        case 'smallint':
        case 'mediumint':
        case 'timestamp':
            return { type: 'integer' };

        // Floats
        case 'real':
        case 'float':
        case 'double':
        case 'double precision':
            return { type: 'float' };

        // Booleans
        case 'boolean':
            return { type: 'boolean' };

        // Enum special case
        case 'enum':

        // As well as postgres enums
        case 'USER-DEFINED':
            return {
                type: 'enum',
                values: getEnumValueMap(col)
            };
        default:
            console.log(col);
            throw new Error('Type "' + col.dataType + '" not recognized');
    }
}

module.exports = columnToObject;
