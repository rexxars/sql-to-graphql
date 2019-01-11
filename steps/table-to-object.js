'use strict'

const pluralize = require('pluralize')
const camelCase = require('lodash/camelCase')
const upperFirst = require('lodash/upperFirst')
const indexBy = require('lodash/keyBy')
const columnToObject = require('./column-to-object')

function tableToObject(table, opts) {
  var normalized = normalizeTableName(table.name, {
    suffix: opts.stripSuffix,
    prefix: opts.stripPrefix
  })

  const fields = table.columns.map(function(column) {
    return columnToObject(column, opts)
  })

  const model = {
    name: getTypeName(normalized),
    description: table.comment,
    table: table.name,
    tableName: table.name,
    normalizedTable: normalized,
    fields: indexBy(fields, 'name'),
    aliasedFields: fields.reduce(function(aliases, field) {
      if (field.name !== field.originalName) {
        aliases[field.originalName] = field.name
      }

      return aliases
    }, {}),
    idFieldNum: 0 //_pick(fields, f => f.isPrimaryKey)
  }
  model.type = model.name
  model.field = model.type.charAt(0).toLowerCase() + model.type.slice(1)

  // Find primary key
  // If none, assume column named 'id' is primary key
  let pk = fields.find(f => f.isPrimaryKey)
  if (!pk) {
    pk = fields.find(f => f.name === 'id')
    if (pk) {
      pk.isPrimaryKey = true
    }
  }
  model.pkName = pk && pk.name

  return model
}

function getTypeName(item) {
  return pluralize(upperFirst(camelCase(item)), 1)
}

function normalizeTableName(name, strip) {
  ;(strip.suffix || []).forEach(function(suffix) {
    name = name.replace(new RegExp(escapeRegExp(suffix) + '$'), '')
  })

  ;(strip.prefix || []).forEach(function(prefix) {
    name = name.replace(new RegExp('^' + escapeRegExp(prefix)), '')
  })

  return name
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}

module.exports = tableToObject
