#!/usr/bin/env node
'use strict';

var path = require('path');
var opts = require('./cli/args');
var async = require('async');
var prompts = require('./cli/prompts');
var partial = require('lodash/function/partial');
var backends = require('./backends');
var mapValues = require('lodash/object/mapValues');
var steps = {
    getTables: require('./steps/table-list'),
    tableToObject: require('./steps/table-to-object'),
    findReferences: require('./steps/find-references'),
    generateTypes: require('./steps/generate-types'),
    outputData: require('./steps/output-data'),

    collect: {
        tableStructure: require('./steps/table-structure'),
        tableComments: require('./steps/table-comment')
    }
};

// Do we support the given backend?
var backend = backends(opts.backend);
if (!backend) {
    return bail(new Error('Database backend "' + opts.backend + '" not supported'));
}

// Instantiate the adapter for the given backend
var adapter = backend(opts);

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
    adapter.close();

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
    data.types = steps.generateTypes(data, opts);

    steps.outputData(data, opts, onDataOutput);
}

// When the data has been written to stdout/files
function onDataOutput() {
    if (!opts.outputDir) {
        return;
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
