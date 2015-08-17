'use strict';

var fs = require('fs');
var path = require('path');
var merge = require('lodash/object/merge');
var recast = require('recast');
var mkdirp = require('mkdirp');
var printAst = require('../util/print-ast');
var buildType = require('./ast-builders/type');
var buildConfig = require('./ast-builders/config');
var buildProgram = require('./ast-builders/program');
var buildResolveMap = require('./ast-builders/resolve-map');
var buildSchemaModule = require('./ast-builders/schema-module');
var updatePackageManifest = require('./update-package');
var copyTemplates = require('./copy-templates');

function outputData(data, opts, callback) {
    if (opts.relay) {
        opts = merge({}, opts, { isFromSchema: true });
    }

    if (!opts.outputDir) {
        printAst(
            buildProgram(data, opts),
            opts
        );

        return callback();
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

        // Relay-style or regular GraphQL?
        if (opts.relay) {
            // @todo Not splitting types into individual modules for relay because of
            // circular dependencies + interfaces which are required at definition-type.
            // Obviously we should find a solution to this and split stuff up.
            var schema = recast.prettyPrint(buildProgram(data, opts), opts).code;
            fs.writeFileSync(path.join(outputDir, 'schema.js'), schema);
        } else {
            mkdirp(typesDir, function(typesErr) {
                if (typesErr) {
                    throw typesErr;
                }

                // Write types
                var type, ast, code;
                for (type in data.types) {
                    ast = buildType(data.types[type], opts);
                    code = recast.prettyPrint(ast, opts).code;

                    fs.writeFileSync(path.join(typesDir, data.types[type].varName + '.js'), code);
                }

                // Write the schema!
                code = recast.prettyPrint(buildSchemaModule(data, opts), opts).code;
                fs.writeFileSync(path.join(outputDir, 'schema.js'), code);
            });
        }

        // Build and write the resolve map
        var resolveMap = recast.prettyPrint(buildResolveMap(data, opts), opts).code;
        fs.writeFileSync(path.join(outputDir, 'resolve-map.js'), resolveMap);

        // Copy templates ("static" ones, should probably be named something else)
        copyTemplates(opts.es6 ? 'es6' : 'cjs', outputDir);

        // Update package.json file with any necessary changes
        updatePackageManifest(opts);

        callback();
    });
}

module.exports = outputData;
