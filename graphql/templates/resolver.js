const pluralize = require('pluralize')

module.exports = (model, models) => {
    const { type, field, tableName, pkName, fields } = model

    const imports = {}
    const getRefs = []

    model.references.forEach(ref => {
        const { field, refField } = ref
        const type = ref.model.type
        const findOneType = 'findOne' + type

        imports[findOneType] = `import {${findOneType}} from './${type}'`

        getRefs.push(`reqRefField = selections.find(f => f.kind === 'Field' && f.name.value === '${field}')
    if (reqRefField) {
      // filter on parent
      let args = { ${ref.model.pkName}: row['${refField}'] }
      // Add any additional filters
      reqRefField.arguments.forEach(arg => {
        args[arg.name.value] = arg.value.value
      })
      row.${field} = ${findOneType}(args, reqRefField.selectionSet.selections)
    }
`)
    })

    model.listReferences.forEach(ref => {
        const { type } = ref.model
        const findTypeList = 'find' + pluralize(type)

        imports[findTypeList] = `import {${findTypeList}} from './${type}'`

        getRefs.push(
            `reqRefField = selections.find(f => f.kind === 'Field' && f.name.value === '${
                ref.field
            }')
  if (reqRefField) {
    // filter on parent
    let args = { ${ref.refField}: row['${ref.model.pkName}']  }
    // Add any additional filters
    reqRefField.arguments.forEach(arg => {
      args[arg.name.value] = arg.value.value
    })
    row.${ref.field} = ${findTypeList}(args, reqRefField.selectionSet.selections)
  }
`
        )
    })

    const resolverDefJS = `
import _pick from 'lodash/pick'
import { findOne, find, create, findOneAndUpdate, findOneAndDelete } from '../operations'

// Repeat for relations
${Object.values(imports).join('\n')}

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
  let reqRefField
  ${getRefs.join('\n')}
  return row
}

// The ${type} resolver.
export const findOne${type} = (args, selections) =>
  findOne(bridge, args)  ${getRefs.length === 0 ? '/*' : ''}
.then(row => resolveRefs(row, selections))${getRefs.length === 0 ? '*/' : ''}

export const find${pluralize(type)} = (args, selections) =>
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
    ${pluralize(field)}: (parent, args, context, info) =>
    find${pluralize(type)}(args, info.fieldNodes[0].selectionSet.selections)
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
