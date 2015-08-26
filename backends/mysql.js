'use strict';

var knex = require('knex');
var pluck = require('lodash/collection/pluck');
var mapKeys = require('lodash/object/mapKeys');
var contains = require('lodash/collection/includes');
var camelCase = require('lodash/string/camelCase');
var undef;

module.exports = function mysqlBackend(opts, callback) {
    var mysql = knex({
        client: 'mysql',
        connection: opts
    });

    process.nextTick(callback);

    return {
        getTables: function(tableNames, cb) {
            var matchAll = tableNames.length === 1 && tableNames[0] === '*';

            mysql
                .distinct('table_name')
                .from('information_schema.columns')
                .where('table_schema', opts.db)
                .catch(cb)
                .then(function(tbls) {
                    tbls = pluck(tbls, 'table_name');

                    if (!matchAll) {
                        tbls = tbls.filter(function(tbl) {
                            return contains(tableNames, tbl);
                        });
                    }

                    cb(null, tbls);
                });
        },

        getTableComment: function(tableName, cb) {
            mysql
                .first('table_comment AS comment')
                .from('information_schema.tables')
                .where({
                    'table_schema': opts.db,
                    'table_name': tableName
                })
                .catch(cb)
                .then(function(info) {
                    cb(null, info ? info.comment || undef : undef);
                });
        },

        getTableStructure: function(tableName, cb) {
            mysql
                .select([
                    'table_name',
                    'column_name',
                    'ordinal_position',
                    'is_nullable',
                    'data_type',
                    'column_key',
                    'column_type',
                    'column_comment'
                ])
                .from('information_schema.columns')
                .where({
                    'table_schema': opts.db,
                    'table_name': tableName
                })
                .orderBy('ordinal_position', 'asc')
                .catch(cb)
                .then(function(info) {
                    cb(null, (info || []).map(camelCaseKeys));
                });
        },

        hasDuplicateValues: function(table, column, cb) {
            mysql
                .count(column + ' as hasSameValues')
                .from(table)
                .groupBy(column)
                .having('hasSameValues', '>', 1)
                .limit(1)
                .catch(cb)
                .then(function(info) {
                    cb(null, (info || []).length > 0);
                });
        },

        close: function(cb) {
            mysql.destroy(cb);
        }
    };
};

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key);
    });
}
