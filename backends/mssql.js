/* eslint camelcase: 0 */
'use strict';

var knex = require('knex');
var mapKeys = require('lodash/mapKeys');
var contains = require('lodash/includes');
var camelCase = require('lodash/camelCase');
var pluck = require('lodash/map');
var undef;

module.exports = function mssqlBackend(opts, callback) {
    var mssql = knex({
        client: 'mssql',
        connection: opts
    });

    var opt_schema = opts.schema;

    process.nextTick(callback);

    var tablename_expr = "table_schema + '.' + table_name"

    return {
        getTables: function(tableNames, cb) {
            var matchAll = tableNames.length === 1 && tableNames[0] === '*';

            var select_expr = mssql.raw(tablename_expr + ' as name')
            var sql =
              mssql
                .select(select_expr)
                .from('information_schema.tables')
                .where('table_type', 'BASE TABLE')
            if (opt_schema) {
              sql = sql
                .where('table_schema', opt_schema)
            }

              sql
                .catch(cb)
                .then(function(tbls) {
                    tbls = pluck(tbls, 'name');
                if (!matchAll) {
                    tbls = tbls.filter(function(tbl) {
                        return contains(tableNames, tbl);
                    });
                }
                cb(null, tbls);
            });
        },

        getTableComment: function(tableName, cb) {
            // TODO get comment from sys tables
            return cb(null, undef)
            mssql
                .first('table_comment AS comment')
                .from('information_schema.tables')
                .where('\'' + tableName + '='
                )
                .catch(cb)
                .then(function(info) {
                    cb(null, info ? info.comment || undef : undef);
                });
        },

        getTableStructure: function(tableName, cb) {
            var where_expr = mssql.raw(tablename_expr + " = '" + tableName + "'")
console.log('where_expr', where_expr.sql)
                  mssql
                .select([
                    'table_name',
                    'column_name',
                    'ordinal_position',
                    'is_nullable',
                    'data_type'
                ])
                .from('information_schema.columns')
                .where(where_expr)
                .orderBy('ordinal_position', 'asc')
                .catch(cb)
                .then(function(info) {
                    // info.fieldName = table.fieldName
                    // info.dbTableName = table.dbTableName
                    cb(null, (info || []).map(camelCaseKeys));
                });
        },

        hasDuplicateValues: function(tableName, column, cb) {
            mssql
                .count(column + ' as hasSameValues')
                .from(tableName)
                .groupBy(column)
                .having(knex.raw('count(*) > 1'))
                .limit(1)
                .catch(cb)
                .then(function(info) {
                    cb(null, (info || []).length > 0);
                });
        },

        close: function(cb) {
            mssql.destroy(cb);
        }
    };
};

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key);
    });
}
