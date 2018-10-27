/* eslint camelcase: 0 */
'use strict';

var knex = require('knex');
var pluck = require('lodash/map');
var contains = require('lodash/includes');

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
                .select('name')
                .from('sqlite_master')
                .whereIn('type', ['table', 'views'])
                .andWhere('name', 'not like', 'sqlite_%')
                .orderBy('name', 'asc')
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
            cb(null, '');
        },

        getTableStructure: function(tableName, cb) {
            var dbName = opts.database || 'main';
            var rawSql = 'pragma '
                         + escape(dbName)
                         + '.table_info('
                         + escape(tableName)
                         + ');';
            sqlite
                .raw(rawSql)
                .catch(cb)
                .then(function(info) {
                    var structure = info.map(function(col) {
                        var parensAndContents = /\(.+\)/;
                        var sanitizedType = col.type
                                               .toLowerCase()
                                               .replace(parensAndContents, '');
                        return {
                            columnName: col.name,
                            isNullable: col.notnull !== 1,
                            columnKey: col.pk === 1 ? 'PRI' : null,
                            dataType: sanitizedType
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

function escape (str) {

  str = str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      default: return "\\"+s;
    }
  });
  return "'"+str+"'";
};
