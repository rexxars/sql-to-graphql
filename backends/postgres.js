'use strict';

var knex = require('knex');
var uniq = require('lodash/array/uniq');
var pluck = require('lodash/collection/pluck');
var mapKeys = require('lodash/object/mapKeys');
var contains = require('lodash/collection/includes');
var mapValues = require('lodash/object/mapValues');
var camelCase = require('lodash/string/camelCase');
var undef;

module.exports = function postgresBackend(opts, cb) {
    var up = '';
    if (opts.user !== 'root' || opts.password) {
        up = opts.user + ':' + opts.password + '@';
    }

    var conString = (
        'postgres://' + up + opts.host + '/' + opts.db
    );

    var pgSchemas = ['pg_catalog', 'pg_statistic', 'information_schema'];
    var pg = knex({
        client: 'pg',
        connection: conString
    });

    process.nextTick(cb);

    return {
        getTables: function(tableNames, cb) {
            var matchAll = tableNames.length === 1 && tableNames[0] === '*';

            pg('information_schema.tables')
                .distinct('table_name')
                .where({
                    table_catalog: opts.db,
                    table_type: 'BASE TABLE'
                })
                .whereNotIn('table_schema', pgSchemas)
                .then(function(tbls) {
                    tbls = pluck(tbls, 'table_name');

                    if (!matchAll) {
                        tbls = tbls.filter(function(tbl) {
                            return contains(tableNames, tbl);
                        });
                    }

                    cb(null, tbls);
                })
                .catch(cb);
        },

        getTableComment: function(tableName, cb) {
            var q = 'SELECT obj_description(?::regclass, \'pg_class\') AS table_comment';
            pg.raw(q, [tableName]).then(function(info) {
                cb(null, ((info || [])[0] || {}).table_comment || undef);
            }).catch(cb);
        },

        getTableStructure: function(tableName, cb) {
            pg.select('table_name', 'column_name', 'ordinal_position', 'is_nullable', 'data_type', 'udt_name')
                .from('information_schema.columns AS c')
                .where({
                    table_catalog: opts.db,
                    table_name: tableName
                })
                .whereNotIn('table_schema', pgSchemas)
                .orderBy('ordinal_position', 'asc')
                .catch(cb)
                .then(function(columns) {
                    var enumQueries = uniq(columns.filter(function(col) {
                        return col.data_type === 'USER-DEFINED';
                    }).map(function(col) {
                        return 'enum_range(NULL::' + col.udt_name + ') AS ' + col.udt_name;
                    })).join(', ');

                    pg.raw('SELECT ' + (enumQueries || '1 AS "1"')).then(function(enumRes) {
                        var enums = enumRes.rows[0];

                        var subQuery = pg.select('constraint_name')
                            .from('information_schema.table_constraints')
                            .where({
                                table_catalog: opts.db,
                                table_name: tableName,
                                constraint_type: 'PRIMARY KEY'
                            })
                            .whereNotIn('table_schema', pgSchemas);

                        pg.first('column_name AS primary_key')
                            .from('information_schema.key_column_usage')
                            .where({
                                table_catalog: opts.db,
                                table_name: tableName,
                                'constraint_name': subQuery
                            })
                            .whereNotIn('table_schema', pgSchemas)
                            .then(function(pk) {
                                var pkCol = (pk || {}).primary_key;
                                columns = columns.map(function(col) {
                                    var isUserDefined = col.data_type === 'USER-DEFINED';
                                    col.column_key = col.column_name === pkCol ? 'PRI' : null;
                                    col.column_type = isUserDefined ? enums[col.udt_name] : null;
                                    return col;
                                });

                                cb(null, (columns || []).map(camelCaseKeys));
                            });
                    }).catch(cb);
                });
        },

        close: function(cb) {
            pg.destroy(cb);
        }
    };
};

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key);
    });
}
