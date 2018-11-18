'use strict';

let { schema } = require('./schema')

const {promisify} = require('util');
const path = require('path');
const async = require('async');
const opts = require('./cli/args');
const prompts = require('./cli/prompts');
const merge = require('lodash/merge');
const partial = require('lodash/partial');
const backends = require('./backends');
const mapValues = require('lodash/mapValues');
const steps = {
  getTables: require('./steps/table-list'),
  tableToObject: require('./steps/table-to-object'),
  findReferences: require('./steps/find-references'),
  findOneToManyReferences: require('./steps/find-one-to-many-rels'),
  outputData: require('./steps/output-data'),

  collect: {
    tableStructure: require('./steps/table-structure'),
    tableComments: require('./steps/table-comment')
  }
};

// Force recast to throw away whitespace information
opts.reuseWhitespace = false;

if (opts.backend === 'sqlite' && !opts.database) {
  opts.database = 'main';
}

if (opts.backend === 'sqlite' && !opts.dbFilename) {
  return bail(new Error('You need to specify a database filename (--db-filename) when using the \'sqlite\' backend'));
}

if (!opts.interactive && !opts.database) {
  return bail(new Error('You need to specify a database (--database)'));
}

if (!opts.interactive && !opts.outputDir) {
  return bail(new Error('You need to provide an output directory (--output-dir=<path>) to generate an application'));
}

if (opts.interactive) {
  prompts.dbCredentials(opts, function (options) {
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

  prompts.outputPath(function (outPath) {
    opts.outputDir = outPath;

    initStyleOpts();
  });
}

function initStyleOpts() {
  if (!opts.interactive) {
    return instantiate();
  }

  prompts.styleOptions(opts, function (options) {
    opts = options;

    instantiate();
  });
}

var adapter;
async function instantiate() {

  const sleep = promisify(setTimeout)
  const getTablesAsync = promisify(steps.getTables);

  // Will hold a list of table names
  let tableNames

  try {
    // Do we support the given backend?
    let backend = backends(opts.backend)
    if (!backend) {
      return bail(new Error('Database backend "' + opts.backend + '" not supported'));
    }

    // Instantiate the adapter for the given backend
    adapter = backend(opts, function (err) {
        bailOnError(err);
    })

    await sleep(1000)

    // If we're in interactive mode, prompt the user to select from the list of available tables
    if (opts.interactive) {
      tableNames = await prompts.tableSelection(tableNames)
    } else {
      tableNames = await getTablesAsync(adapter, opts)
    }
    
    return onTablesSelected(tableNames);
  }
  catch(err) {
    bailOnError(err);
  }
}

// When tables have been selected, fetch data for those tables
function onTablesSelected(tables) {
  // Assign partialed functions to make the code slightly more readable
  steps.collect = mapValues(steps.collect, function (method) {
    return partial(method, adapter, { tables: tables });
  });

  // Collect the data in parallel
  async.parallelLimit(steps.collect, 10, onTableDataCollected);
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
  data.models = steps.findReferences(models, opts);

  // Note: This mutates the models - sorry. PRs are welcome.
  steps.findOneToManyReferences(adapter, data.models, function (refErr) {
    if (refErr) {
      throw refErr;
    }

    // data.types = steps.generateTypes(data, opts);

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
    throw err
    return bail(err);
  }
}
