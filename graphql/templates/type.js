const pluralize = require('pluralize')

module.exports = model => {
    const { type, field, pkName, fields } = model
    const pkType = pkName && fields[pkName].type

    const typeDescription = model.description
        ? `  "${model.description}"
  `
        : ''

    const typeFieldsSDL = getTypeFieldsSDL(model)
    const fieldsSDLBang = getFieldsSDLBang(model)
    const fieldsSDLBangPK = getFieldsSDLBangPK(model)
    const fieldsSDLNoBang = getFieldsSDLNoBang(model)

    const typeDefJS = `export default
\`${typeDescription}  type ${type} {
    ${typeFieldsSDL}
  }

  type Query {
    ${field}(${fieldsSDLNoBang}): ${type}
    ${pluralize(field)}: [${type}]
  }

  type Mutation {
    add${type}(${fieldsSDLBang}): ${type}
    edit${type}(${fieldsSDLBangPK}): ${type}
    delete${type}(${pkName}: ${pkType}!): ConfirmDeleteKey
  }
\``

    return typeDefJS
}

function typX(type, isNullable) {
    return `${type}${isNullable ? '' : '!'}`
}

function getTypeFieldsSDL(model) {
    let typeFields = []

    Object.keys(model.fields)
        .map(f => model.fields[f])
        .forEach(f => {
            if (f.description) {
                typeFields.push(`"${f.description}"`)
            }
            typeFields.push(`${f.name}: ${typX(f.type, f.isNullable)}`)
        })

    model.references.forEach(ref => {
        if (ref.description) {
            typeFields.push(`"${ref.description}"`)
        }
        let arglist = getFieldsSDLExJoinField(ref.model, ref.model.pkName)
        typeFields.push(`${ref.field}(${arglist}): ${ref.model.type}`)
    })

    model.listReferences.forEach(ref => {
        if (ref.description) {
            typeFields.push(`"${ref.description}"`)
        }
        let arglist = getFieldsSDLExJoinField(ref.model, ref.refField)
        typeFields.push(`${ref.field}(${arglist}): [${ref.model.type}]`)
    })

    return typeFields.join('\n    ')
}

function getFieldsSDLBang(model) {
    return Object.keys(model.fields)
        .map(f => model.fields[f])
        .map(f => `${f.name}: ${typX(f.type, f.isNullable)}`)
        .join(', ')
}

function getFieldsSDLBangPK(model) {
    return Object.keys(model.fields)
        .map(f => model.fields[f])
        .map(f => f.name + ':' + f.type + (f.name === f.pkName ? '!' : ''))
        .join(', ')
}

function getFieldsSDLNoBang(model) {
    return Object.keys(model.fields)
        .map(f => model.fields[f])
        .map(f => `${f.name}: ${f.type}`)
        .join(', ')
}

function getFieldsSDLExJoinField(model, joinField) {
    return Object.keys(model.fields)
        .map(f => model.fields[f])
        .filter(f => f.name !== joinField)
        .map(f => `${f.name}: ${f.type}`)
        .join(', ')
}
