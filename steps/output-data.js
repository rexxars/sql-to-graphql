'use strict'

var fs = require('fs')
var path = require('path')
var merge = require('lodash/merge')
var mkdirp = require('mkdirp')

const configDef = require('../graphql/templates/config')
const typeDef = require('../graphql/templates/type')
const resolverDef = require('../graphql/templates/resolver')

function outputData(data, opts, callback) {
    if (opts.relay) {
        opts = merge({}, opts, { isFromSchema: true })
    }

    // Output to a directory, in other words: split stuff up
    var outputDir = path.resolve(opts.outputDir)
    var typesDir = path.join(outputDir, 'graphql/types')
    var resolversDir = path.join(outputDir, 'graphql/resolvers')
    var configDir = path.join(outputDir, 'config')

    // Write types
    mkdirp.sync(configDir)
    mkdirp.sync(typesDir) 
    mkdirp.sync(resolversDir) 
        // Write a type index
    fs.writeFileSync(path.join(configDir, 'config.js'), configDef(opts))
    for (let name in data.models) {
        let model = data.models[name]
            let type = model.type
            fs.writeFileSync(path.join( typesDir, `${type}.js`), typeDef(model, data.models))
            fs.writeFileSync(path.join( resolversDir, `${type}.js`), resolverDef(model, data.models))
        }

    callback()
}

module.exports = outputData
