'use strict'

const async = require('async')

function getTableStructures(adapter, opts, cb) {
  const tables = opts.tables.reduce(function(map, tbl) {
    map[tbl] = getTableStructureTask(adapter, tbl)
    return map
  }, {})

  async.parallel(tables, cb)
}

function getTableStructureTask(adapter, tblName) {
  return function getTableStructure(cb) {
    adapter.getTableStructure(tblName, cb)
  }
}

module.exports = getTableStructures
