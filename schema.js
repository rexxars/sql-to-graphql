module.exports.schema = models => {
    return Object.keys(models)
        .reduce((typeList, model) => {
            const { name, fields } = models[model]
            typeList.push('type ' + name + '{')

            typeList.push(
                Object.keys(fields).reduce((fieldList, field) => {
                    const { name, type, isNullable } = fields[field]
                    // console.log(JSON.stringify(fields[field]))
                    fieldList.push('  ' + name + ': ' + type + (isNullable ? '' : '!'))
                    return fieldList
                }, [])
            )

            typeList.push('}')
            return typeList
        }, [])
        .join('\n')
}
