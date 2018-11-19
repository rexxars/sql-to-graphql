'use strict'

const fs = require('fs-extra')
const path = require('path')

const configDef = require('../graphql/templates/config')
const typeDef = require('../graphql/templates/type')
const resolverDef = require('../graphql/templates/resolver')

function outputData(data, opts, callback) {
    if (opts.relay) {
        opts.isFromSchema = true
    }

    // Output to a directory, in other words: split stuff up
    const outputDir = path.resolve(opts.outputDir)
    const typesDir = path.join(outputDir, 'graphql/types')
    const resolversDir = path.join(outputDir, 'graphql/resolvers')
    const configDir = path.join(outputDir, 'config')

    fs.mkdirpSync(configDir)
    fs.writeFileSync(path.join(configDir, 'config.js'), configDef(opts))

    // Write types

    fs.emptyDirSync(typesDir); 
    fs.emptyDirSync(resolversDir); 

    // Write a type index
    for (let name in data.models) {
        let model = data.models[name]
        let type = model.type
        fs.writeFileSync(path.join( typesDir, `${type}.js`), typeDef(model, data.models))
        fs.writeFileSync(path.join( resolversDir, `${type}.js`), resolverDef(model, data.models))
    }

    callback()
}

module.exports = outputData
