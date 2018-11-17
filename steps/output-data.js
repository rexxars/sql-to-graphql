'use strict'

const fs = require('fs-extra')
const path = require('path')
const merge = require('lodash/merge')
const mkdirp = require('mkdirp')

const configDef = require('../graphql/templates/config')
const typeDef = require('../graphql/templates/type')
const resolverDef = require('../graphql/templates/resolver')

function outputData(data, opts, callback) {
    if (opts.relay) {
        opts = merge({}, opts, { isFromSchema: true })
    }

    // Output to a directory, in other words: split stuff up
    const outputDir = path.resolve(opts.outputDir)
    const typesDir = path.join(outputDir, 'graphql/types')
    const resolversDir = path.join(outputDir, 'graphql/resolvers')
    const configDir = path.join(outputDir, 'config')

    mkdirp.sync(configDir)
    fs.writeFileSync(path.join(configDir, 'config.js'), configDef(opts))

    // Write types

    fs.removeSync(typesDir); 
    mkdirp.sync(typesDir) 
    fs.removeSync(resolversDir); 
    mkdirp.sync(resolversDir)

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
