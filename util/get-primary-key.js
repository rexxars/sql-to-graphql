'use strict'

module.exports = function getPrimaryKey(model) {
  for (let key in model.fields) {
    if (model.fields[key].isPrimaryKey) {
      return model.fields[key]
    }
  }

  return false
}
