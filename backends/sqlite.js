/* eslint camelcase: 0 */
'use strict';

var knex = require('knex');
var knexString = require('knex/src/query/string') 
var pluck = require('lodash/collection/pluck');
var contains = require('lodash/collection/includes');
var undef;

module.exports = function sqliteBackend(opts, callback) {
    var sqlite = knex({
        client: 'sqlite',
        connection: {
            filename: opts.dbFilename
        }
    });

    process.nextTick(callback);

    return {
        getTables: function(tableNames, cb) {
            var matchAll = tableNames.length === 1 && tableNames[0] === '*';
            sqlite
                .select("name")
                .from("sqlite_master")
                .whereIn("type", ["table", "views"])
                .andWhere("name", "not like", "sqlite_%")
                .orderBy('id', 'asc')
                .catch(cb)
                .then(function(tbls) {
                    tbls = pluck(tbls, "name");
                    if (!matchAll) {
                        tbls = tbls.filter(function(tbl) {
                            return contains(tableNames, tbl);
                        });
                    }
                    cb(null, tbls);
                });
        },

        getTableComment: function(tableName, cb) {
            cb(null, "")
        },

        getTableStructure: function(tableName, cb) {
            var dbName = opts.database || "main"
            var rawSql = "pragma "
                         + knexString.escape(dbName)
                         + ".table_info("
                         + knexString.escape(tableName)
                         + ");"
            sqlite
                .raw(rawSql)
                .catch(cb)
                .then(function(info) {
                    var structure = info.map(function(col) {
                        return {
                            columnName: col.name,
                            isNullable: col.notnull !== 1,
                            columnKey: col.pk === 1 ? 'PRI' : null,
                            dataType: col.type
                        };
                    });
                    cb(null, structure);
                });
        },

        hasDuplicateValues: function(table, column, cb) {
            sqlite
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
            sqlite.destroy(cb);
        }
    };
};
