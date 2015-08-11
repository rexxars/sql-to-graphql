'use strict';

var fs = require('fs');
var path = require('path');
var recast = require('recast');
var mkdirp = require('mkdirp');
var printAst = require('../util/print-ast');
var buildType = require('./ast-builders/type');
var buildConfig = require('./ast-builders/config');
var buildProgram = require('./ast-builders/program');
var buildSchemaModule = require('./ast-builders/schema-module');
var copyTemplates = require('./copy-templates');

function outputData(data, opts, callback) {
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
    mkdirp(typesDir, function(err) {
        if (err) {
            throw err;
        }

        // Write the configuration file
        mkdirp(configDir, function(configErr) {
            if (configErr) {
                throw configErr;
            }

            var conf = recast.prettyPrint(buildConfig(opts), opts).code;
            fs.writeFileSync(path.join(configDir, 'config.js'), conf);
        });

        // Copy templates ("static" ones, should probably be named something else)
        copyTemplates(opts.es6 ? 'es6' : 'cjs', outputDir);

        // Write types
        var type, ast, code;
        for (type in data.types) {
            ast = buildType(data.types[type], opts);
            code = recast.prettyPrint(ast, opts).code;

            fs.writeFileSync(path.join(typesDir, data.types[type].varName + '.js'), code);
        }

        // Write the all-important schema!
        code = recast.prettyPrint(buildSchemaModule(data, opts), opts).code;
        fs.writeFileSync(path.join(outputDir, 'schema.js'), code);

        callback();
    });
}

module.exports = outputData;
