const pluralize = require('pluralize')

module.exports = model => {
    const typX = (type, isNullable) => `${type}${isNullable ? '' : '!'}`

    const { type, field, pkName, fields } = model

    const typeDescription = model.description ? `  "${model.description}"
  ` : ''

    let fields1 = []
    Object.keys(fields)
      .map(f => fields[f])
      .forEach(f => {
        if (f.description) {
          fields1.push(`"${f.description}"`)
        }
        fields1.push(`${f.name}: ${typX(f.type, f.isNullable)}`)
      })
    model.references.forEach(f => {
      if (f.description) {
        fields1.push(`"${f.description}"`)
      }
      fields1.push(`${f.field}: ${f.model.type}`)
    })
    model.listReferences.forEach(f => {
      if (f.description) {
        fields1.push(`"${f.description}"`)
      }
      fields1.push(`${f.field}: [${f.model.type}]`)
    })
    fields1 = fields1.join('\n    ')

    const fields2 = Object.keys(fields)
        .map(f => fields[f])
        .map(f => `${f.name}: ${typX(f.type, f.isNullable)}`)
        .join(', ')

    const fields3 = Object.keys(fields)
        .map(f => fields[f])
        .map(f => `${f.name}: ${f.type}`)
        .join(', ')

    const typeDefJS = `export default
\`${typeDescription}  type ${type} {
    ${fields1}
  }

  type Query {
    ${field}(${fields3}): ${type}
    ${pluralize(field)}: [${type}]
  }

  type Mutation {
    add${type}(${fields2}): ${type}
    edit${type}(${fields3}): ${type}
    delete${type}(${fields3}): ConfirmDeleteKey
  }
\``

    return typeDefJS
}
