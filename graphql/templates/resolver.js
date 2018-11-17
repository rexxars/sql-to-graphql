const _camelCase = require('lodash/camelCase')
const _pick = require('lodash/pick')

module.exports = (model, models) => {
    const { type, typePlural, field, fieldPlural, tableName, pkName, fields } = model

    const imports = []
    const getRefs = []
    const findType = []

    model.references.forEach(ref => {
        const { field, refField } = ref
        const type = ref.model.type

        imports.push(`import {findOne${type}} from './${type}'`)

        getRefs.push(`const ${field}Field = selections.find(f => f.kind === 'Field' && f.name.value === '${field}')
    if (${field}Field) {
      row.${field} = findOne${type}({ ${
            ref.model.pkName
        }: row['${refField}'] }, ${field}Field.selectionSet.selections)
    }
`)
    })

    model.listReferences.forEach(ref => {
        const { fieldPlural, typePlural, type } = ref.model
        imports.push(`import {find${typePlural}} from './${type}'`)

        getRefs.push(
            `const ${fieldPlural}Field = selections.find(f => f.kind === 'Field' && f.name.value === '${fieldPlural}')
 if (${fieldPlural}Field) {
      row.${fieldPlural} = find${typePlural}({ ${ref.refField}: row['${
                ref.model.pkName
            }'] }, ${fieldPlural}Field.selectionSet.selections)
    }
`
        )
    })

    const resolverDefJS = `
import _pick from 'lodash/pick'
import { findOne, find, create, findOneAndUpdate, findOneAndDelete } from '../../knex/operations'

// Repeat for relations
${imports.join('\n')}

const bridge = {
  type: '${type}',
  fieldName: '${field}',
  tableName: '${tableName}',
  fieldColumnMap: {
    ${Object.keys(fields)
        .map(f => fields[f])
        .map(f => `'${f.name}': '${f.originalName}'`)
        .join(',\n    ')}
  },
  pkField: '${pkName}'
}

const resolveRefs = (row, selections) => {
  ${getRefs.join('\n')}
  return row
}

// The ${type} resolver.
export const findOne${type} = (args, selections) =>
  findOne(bridge, args)  ${getRefs.length === 0 ? '/*' : ''}
.then(row => resolveRefs(row, selections))${getRefs.length === 0 ? '*/' : ''}

export const find${typePlural} = (args, selections) =>
  find(bridge, args)  ${getRefs.length === 0 ? '/*' : ''}
  .then(rows => {
    rows.forEach(
      row => resolveRefs(row, selections)
    )
    // Could restrict to selected fields but GraphQL will do so anyway
    return rows
})${getRefs.length === 0 ? '*/' : ''}

export default {
  Query: {
    ${field}: (parent, args, context, info) =>
    findOne${type}(args, info.fieldNodes[0].selectionSet.selections),
    ${fieldPlural}: (parent, args, context, info) =>
    find${typePlural}(args, info.fieldNodes[0].selectionSet.selections)
  },
  Mutation: {
    add${type}: (parent, args, context, info) => create(bridge, args),
    edit${type}: (parent, args, context, info) => findOneAndUpdate(bridge, args),
    delete${type}: (parent, args, context, info) => findOneAndDelete(bridge, args)
  }
}

`
    return resolverDefJS
}
