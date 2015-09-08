#!/usr/bin/env node
'use strict';

var path = require('path');
var async = require('async');
var opts = require('./cli/args');
var prompts = require('./cli/prompts');
var merge = require('lodash/object/merge');
var partial = require('lodash/function/partial');
var backends = require('./backends');
var mapValues = require('lodash/object/mapValues');
var steps = {
    getTables: require('./steps/table-list'),
    tableToObject: require('./steps/table-to-object'),
    findReferences: require('./steps/find-references'),
    findOneToManyReferences: require('./steps/find-one-to-many-rels'),
    generateTypes: require('./steps/generate-types'),
    outputData: require('./steps/output-data'),

    collect: {
        tableStructure: require('./steps/table-structure'),
        tableComments: require('./steps/table-comment')
    }
};

// Force recast to throw away whitespace information
opts.reuseWhitespace = false;

if (!opts.interactive && !opts.database) {
    return bail(new Error('You need to specify a database (--database)'));
}

if (!opts.interactive && !opts.outputDir) {
    return bail(new Error('You need to provide an output directory (--output-dir=<path>) to generate an application'));
}

if (opts.interactive) {
    prompts.dbCredentials(opts, function(options) {
        opts = merge({}, opts, options);

        initOutputPath();
    });
} else {
    initOutputPath();
}

function initOutputPath() {
    if (opts.outputDir) {
        return initStyleOpts();
    }

    prompts.outputPath(function(outPath) {
        opts.outputDir = outPath;

        initStyleOpts();
    });
}

function initStyleOpts() {
    if (!opts.interactive) {
        return instantiate();
    }

    prompts.styleOptions(opts, function(options) {
        opts = options;

        instantiate();
    });
}

var adapter;
function instantiate() {
    // Do we support the given backend?
    var backend = backends(opts.backend);
    if (!backend) {
        return bail(new Error('Database backend "' + opts.backend + '" not supported'));
    }

    // Instantiate the adapter for the given backend
    adapter = backend(opts, function(err) {
        bailOnError(err);

        setTimeout(getTables, 1000);
    });
}

function getTables() {
    // Collect a list of available tables
    steps.getTables(adapter, opts, function(err, tableNames) {
        bailOnError(err);

        // If we're in interactive mode, prompt the user to select from the list of available tables
        if (opts.interactive) {
            return prompts.tableSelection(tableNames, onTablesSelected);
        }

        // Use the found tables (or a filtered set if --table is used)
        return onTablesSelected(tableNames);
    });
}

// When tables have been selected, fetch data for those tables
function onTablesSelected(tables) {
    // Assign partialed functions to make the code slightly more readable
    steps.collect = mapValues(steps.collect, function(method) {
        return partial(method, adapter, { tables: tables });
    });

    // Collect the data in parallel
    async.parallel(steps.collect, onTableDataCollected);
}

// When table data has been collected, build an object representation of them
function onTableDataCollected(err, data) {
    bailOnError(err);

    var tableName, models = {}, model;
    for (tableName in data.tableStructure) {
        model = steps.tableToObject({
            name: tableName,
            columns: data.tableStructure[tableName],
            comment: data.tableComments[tableName]
        }, opts);

        models[model.name] = model;
    }

    data.models = steps.findReferences(models);

    // Note: This mutates the models - sorry. PRs are welcome.
    steps.findOneToManyReferences(adapter, data.models, function(refErr) {
        if (refErr) {
            throw refErr;
        }

        data.types = steps.generateTypes(data, opts);

        adapter.close();
        steps.outputData(data, opts, onDataOutput);
    });
}

// When the data has been written to stdout/files
function onDataOutput() {
    if (!opts.outputDir) {
        return;
    }

    if (opts.interactive) {
        console.log('\n\n\n');
    }

    var dir = path.resolve(opts.outputDir);
    console.log('Demo app generated in ' + dir + '. To run:');
    console.log('cd ' + dir);
    console.log('npm install');
    console.log('npm start');
    console.log();
    console.log('Then point your browser at http://localhost:3000');
}

function bail(err) {
    console.error(err.message ? err.message : err.toString());
    process.exit(1);
}

function bailOnError(err) {
    if (err) {
        return bail(err);
    }
}
