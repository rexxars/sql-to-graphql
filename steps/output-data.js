'use strict';

var fs = require('fs');
var path = require('path');
var merge = require('lodash/merge');
var recast = require('recast');
var mkdirp = require('mkdirp');
var buildType = require('./ast-builders/type');
var buildConfig = require('./ast-builders/config');
var buildTypeIndex = require('./ast-builders/type-index');
var buildResolveMap = require('./ast-builders/resolve-map');
var buildSchemaModule = require('./ast-builders/schema-module');
var buildNodeDefinitions = require('./ast-builders/node-definitions');
var updatePackageManifest = require('./update-package');
var copyServer = require('./copy-server');

function outputData(data, opts, callback) {
    if (opts.relay) {
        opts = merge({}, opts, { isFromSchema: true });
    }

    // Output to a directory, in other words: split stuff up
    var outputDir = path.resolve(opts.outputDir);
    var typesDir = path.join(outputDir, 'types');
    var configDir = path.join(outputDir, 'config');
    mkdirp(configDir, function(err) {
        if (err) {
            throw err;
        }

        // Write the configuration file
        var conf = recast.prettyPrint(buildConfig(opts), opts).code;
        fs.writeFileSync(path.join(configDir, 'config.js'), conf);

        // Write types
        mkdirp(typesDir, function(typesErr) {
            if (typesErr) {
                throw typesErr;
            }

            // Build the type AST and write the code to separate files
            var type, ast, code;
            for (type in data.types) {
                ast = buildType(data.types[type], opts);
                code = recast.prettyPrint(ast, opts).code;

                fs.writeFileSync(path.join(typesDir, data.types[type].varName + '.js'), code);
            }

            // Write a type index
            ast = buildTypeIndex(data, opts);
            code = recast.prettyPrint(ast, opts).code;
            fs.writeFileSync(path.join(typesDir, 'index.js'), code);

            // If this is a relay app, write the Node interface
            if (opts.relay) {
                ast = buildNodeDefinitions(opts);
                code = recast.prettyPrint(ast, opts).code;
                fs.writeFileSync(path.join(typesDir, 'Node.js'), code);
            }
        });

        // Build and write the resolve map
        var resolveMap = recast.prettyPrint(buildResolveMap(data, opts), opts).code;
        fs.writeFileSync(path.join(outputDir, 'resolve-map.js'), resolveMap);

        // Copy server files
        copyServer( outputDir);

        // Write the schema!
        var schemaCode = recast.prettyPrint(buildSchemaModule(data, opts), opts).code;
        fs.writeFileSync(path.join(outputDir, 'schema.js'), schemaCode);

        // Update package.json file with any necessary changes
        updatePackageManifest(opts);

        callback();
    });
}

module.exports = outputData;
