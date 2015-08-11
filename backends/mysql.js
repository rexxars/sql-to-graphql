'use strict';

var mysql = require('mysql');
var chain = require('lodash').chain;
var mapKeys = require('lodash/object/mapKeys');
var contains = require('lodash/collection/includes');
var mapValues = require('lodash/object/mapValues');
var camelCase = require('lodash/string/camelCase');
var queries = getQueries(), undef;

module.exports = function mysqlBackend(opts) {
    var connection = mysql.createConnection(opts);

    return {
        getTables: function(tableNames, cb) {
            var matchAll = tableNames.length === 1 && tableNames[0] === '*';

            connection.query(queries.tableNames, [opts.db], function(err, tbls) {
                cb(err, chain(tbls || [])
                    .pluck('table_name')
                    .filter(function(tbl) {
                        return matchAll || contains(tableNames, tbl);
                    })
                    .value()
                );
            });
        },

        getTableComment: function(tableName, cb) {
            connection.query(queries.tableComment, [opts.db, tableName], function(err, info) {
                cb(err, ((info || [])[0] || {}).table_comment || undef);
            });
        },

        getTableStructure: function(tableName, cb) {
            connection.query(queries.columnInfo, [opts.db, tableName], function(err, info) {
                cb(err, (info || []).map(camelCaseKeys));
            });
        },

        close: function(cb) {
            connection.end(cb);
        }
    };
};

function getQueries() {
    return mapValues({
        tableNames: [
            'SELECT DISTINCT(`table_name`)',
            'FROM `information_schema`.`columns`',
            'WHERE `table_schema` = ?'
        ],

        tableComment: [
            'SELECT `table_comment`',
            'FROM `information_schema`.`tables`',
            'WHERE `table_schema` = ?',
            'AND `table_name` = ?'
        ],

        columnInfo: [
            'SELECT ',
            '`table_name`,',
            '`column_name`,',
            '`ordinal_position`,',
            '`is_nullable`,',
            '`data_type`,',
            '`column_key`,',
            '`column_type`,',
            '`column_comment`',
            'FROM `information_schema`.`columns`',
            'WHERE `table_schema` = ?',
            'AND `table_name` = ?',
            'ORDER BY `ordinal_position` ASC'
        ]
    }, join);
}

function join(parts) {
    return parts.join(' ');
}

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key);
    });
}
