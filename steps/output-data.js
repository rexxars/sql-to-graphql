'use strict'

var fs = require('fs')
var path = require('path')
var merge = require('lodash/merge')
var recast = require('recast')
var mkdirp = require('mkdirp')

var buildConfig = require('./ast-builders/config')
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
    mkdirp(configDir, function(err) {
        if (err) {
            throw err
        }

        // Write the configuration file
        var conf = recast.prettyPrint(buildConfig(opts), opts).code
        fs.writeFileSync(path.join(configDir, 'config.js'), conf)

        // Write types
        mkdirp.sync(typesDir) 
        mkdirp.sync(resolversDir) 
            // Write a type index
            let name
        for (name in data.models) {
            let model = data.models[name]
                let type = model.type
                fs.writeFileSync(path.join( typesDir, `${type}.js`), typeDef(model, data.models))
                fs.writeFileSync(path.join( resolversDir, `${type}.js`), resolverDef(model, data.models))
            }

        callback()
    })
}

module.exports = outputData
