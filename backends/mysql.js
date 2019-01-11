/* eslint camelcase: 0 */
'use strict'

const knex = require('knex')
const pluck = require('lodash/map')
const mapKeys = require('lodash/mapKeys')
const contains = require('lodash/includes')
const camelCase = require('lodash/camelCase')
let undef

module.exports = function mysqlBackend(opts, callback) {
    const mysql = knex({
        client: 'mysql',
        connection: opts
    })

    process.nextTick(callback)

    return {
        getTables: function(tableNames, cb) {
            const matchAll = tableNames.length === 1 && tableNames[0] === '*'

            mysql
                .select('table_name')
                .from('information_schema.tables')
                .where('table_schema', opts.database)
                .where('table_type', 'BASE TABLE')
                .catch(cb)
                .then(function(tbls) {
                    tbls = pluck(tbls, 'table_name')

                    if (!matchAll) {
                        tbls = tbls.filter(function(tbl) {
                            return contains(tableNames, tbl)
                        })
                    }

                    cb(null, tbls)
                })
        },

        getTableComment: function(tableName, cb) {
            mysql
                .first('table_comment AS comment')
                .from('information_schema.tables')
                .where({
                    table_schema: opts.database,
                    table_name: tableName
                })
                .catch(cb)
                .then(function(info) {
                    cb(null, info ? info.comment || undef : undef)
                })
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
                    table_schema: opts.database,
                    table_name: tableName
                })
                .orderBy('ordinal_position', 'asc')
                .catch(cb)
                .then(function(info) {
                    cb(null, (info || []).map(camelCaseKeys))
                })
        },

        close: function(cb) {
            mysql.destroy(cb)
        }
    }
}

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key)
    })
}
