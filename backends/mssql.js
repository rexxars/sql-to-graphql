/* eslint camelcase: 0 */
'use strict'

const knex = require('knex')
const mapKeys = require('lodash/mapKeys')
const contains = require('lodash/includes')
const camelCase = require('lodash/camelCase')
const pluck = require('lodash/map')

module.exports = function mssqlBackend(opts, callback) {
    const mssql = knex({
        client: 'mssql',
        connection: opts
    })

    opts.stripPrefix = ['dbo.']

    process.nextTick(callback)

    return {
        getTables: function(tableNames, cb) {
            const matchAll = tableNames.length === 1 && tableNames[0] === '*'

            // omit dbo. from table name if dbo schema selected
            const tablename_expr = `table_schema + '.' + table_name`
            // `case when table_schema = 'dbo' then table_name else
            //                 table_schema + '.' + table_name end`

            let sql = mssql
                .select(mssql.raw(tablename_expr + ' as name'))
                .from('information_schema.tables')
                .where('table_type', 'BASE TABLE')
            if (opts.schemas !== '*') {
                sql = sql.whereIn('table_schema', opts.schemas.split(','))
            }

            sql.catch(cb).then(function(tbls) {
                tbls = pluck(tbls, 'name')
                if (!matchAll) {
                    tbls = tbls.filter(function(tbl) {
                        return contains(tableNames, tbl)
                    })
                }
                cb(null, tbls)
            })
        },

        getTableComment: function(tableName, cb) {
            // return cb(null, '')
            const sql = `
                select CAST(ep.value AS sql_variant) AS comment
                FROM sys.tables as tbl
                INNER JOIN sys.extended_properties AS ep
                on tbl.object_id = ep.major_id
                where tbl.object_id = object_id('${tableName}')
                and ep.minor_id = 0
              `
            mssql
                .raw(sql)
                .catch(cb)
                .then(function(comments) {
                    comments = pluck(comments, 'comment')
                    cb(null, comments[0])
                })
        },

        getTableStructure: function(tableName, cb) {
            var ref_tableNameExpr = `rs.name + '.' + rt.name`
            // `case when rs.name = 'dbo' then rt.name else
            //                 rs.name + '.' + rt.name end`

            var sql = `with ref_cols as (
                select ${ref_tableNameExpr} as ref_table_name,
                      fkc.parent_column_id as fk_column_id,
                      rc.name as ref_column_name,
                      count(*) over(partition by fk.name) as num_ref_cols
                FROM sys.foreign_keys AS fk
                inner join sys.foreign_key_columns as fkc
                on fkc.constraint_object_id = fk.object_id
                inner join  sys.columns AS rc
                    ON fkc.referenced_column_id = rc.column_id
                    AND fkc.referenced_object_id = rc.[object_id]
                INNER JOIN sys.tables AS rt -- referenced table
                  ON fk.referenced_object_id = rt.[object_id]
                INNER JOIN sys.schemas AS rs 
                  ON rt.[schema_id] = rs.[schema_id]
                where fk.parent_object_id = object_id('${tableName}')
            ),
            single_fk_cols as (
              select *
              from ref_cols
              where num_ref_cols = 1
            ),
            pk_cols as (
              SELECT c.column_id,
                     ic.key_ordinal,
                     count(*) over() as num_pk_cols
              FROM sys.indexes i
              join sys.index_columns ic on i.object_id = ic.object_id
                                       and i.index_id = ic.index_id
              join sys.columns as c on ic.object_id = c.object_id
                                   and ic.column_id = c.column_id
              where i.object_id = object_id('${tableName}')
              and i.is_primary_key = 1
            ),
            single_pk_cols as (
              select *
              from pk_cols
              where num_pk_cols = 1
            ),
            col as (select c.name as column_name,
                            column_id,
                            c.is_nullable,
                            c.is_identity,
                            st.name as data_type,
                            CAST(ep.value AS sql_variant) as column_comment
                    from sys.columns as c
                    left join sys.extended_properties AS ep
                    on c.object_id = ep.major_id
                    and c.column_id = ep.minor_id
                    and ep.class_desc = 'OBJECT_OR_COLUMN'
                    join sys.types as st
                    on st.user_type_id = c.system_type_id
                    where c.object_id = object_id('${tableName}')
            )
                    
            select '${tableName}' as [table],
                  col.column_name,
                  col.column_id as ordinal_position,
                  col.is_nullable,
                  col.is_identity as is_auto_increment,
                  col.data_type,
                  column_comment,
                  ref_table_name,
                  fk_cols.ref_column_name,
                  case when pk_cols.column_id is null
                    then null
                    else 'PRI'
                  end as columnKey
            from col
            left join single_fk_cols as fk_cols
            on col.column_id = fk_cols.fk_column_id
            left join single_pk_cols as pk_cols
            on col.column_id = pk_cols.column_id
            order by col.column_id  
                  `
            mssql
                .raw(sql)
                .catch(cb)
                .then(function(info) {
                    // info.fieldName = table.fieldName
                    // info.dbTableName = table.dbTableName
                    cb(null, (info || []).map(camelCaseKeys))
                })
        },

        close: function(cb) {
            mssql.destroy(cb)
        }
    }
}

function camelCaseKeys(obj) {
    return mapKeys(obj, function(val, key) {
        return camelCase(key)
    })
}
