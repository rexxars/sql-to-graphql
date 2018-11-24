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

  // Path for files to copy
  const toServerDir = path.resolve(__dirname, '../graphql/to-server')

  // Output to a directory, in other words: split stuff up
  const outputDir = path.resolve(opts.outputDir)
  const configDir = path.join(outputDir, 'config')
  const graphqlDir = path.join(outputDir, 'graphql')
  const typesDir = path.join(graphqlDir, 'types')
  const resolversDir = path.join(graphqlDir, 'resolvers')

  // Generate config file
  fs.mkdirpSync(configDir)
  fs.writeFileSync(path.join(configDir, 'config.js'), configDef(opts))

  // Copy Knex operations and custom types
  fs.mkdirpSync(graphqlDir)
  fs.copySync(toServerDir, graphqlDir)

  // Write types and resolvers
  fs.emptyDirSync(typesDir)
  fs.emptyDirSync(resolversDir)
  for (let name in data.models) {
    let model = data.models[name]
    let type = model.type
    fs.writeFileSync(path.join(typesDir, `${type}.js`), typeDef(model, data.models))
    fs.writeFileSync(path.join(resolversDir, `${type}.js`), resolverDef(model, data.models))
  }

  callback()
}

module.exports = outputData
