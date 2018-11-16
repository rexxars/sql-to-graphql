var capitalize = require('lodash/capitalize')
var pluralize = require('pluralize')

module.exports = tables => {
    let new_models = []
    for (tableName in tables) {
        let fields = tables[tableName]
        model = {
            type: capitalize(tableName),
            field: tableName,
            list: pluralize(tableName),
            idFieldNum: 0,
            fields: fields.map(f => {
                return { name: f.columnName, type: f.dataType, isNullable: f.isNullable }
            })
        }
        new_models.push(model)
    }
    return new_models
}
