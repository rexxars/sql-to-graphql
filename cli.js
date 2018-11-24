'use strict'

let opts = require('./cli/args')

const { promisify } = require('util')
const path = require('path')
const prompts = require('./cli/prompts')
const backends = require('./backends')
const steps = {
    getTables: promisify(require('./steps/table-list')),
    tableToObject: require('./steps/table-to-object'),
    tableStructure: promisify(require('./steps/table-structure')),
    tableComments: promisify(require('./steps/table-comment')),
    findReferences: require('./steps/find-references'),
    outputData: promisify(require('./steps/output-data'))
}

getOpts(opts)
    .then(opts => checkOpts(opts))
    .then(opts => instantiate(opts))
    .then(opts => epilogue(opts))

async function getOpts(opts) {
    opts = Object.assign({}, opts)

    if (opts.interactive) {
        let options

        options = await prompts.backend(opts)
        opts = { ...opts, ...options }
        options = await prompts.dbCredentials(opts)
        opts = { ...opts, ...options }

        if (!opts.outputDir) {
            options = await prompts.outputPath()
            opts = { ...opts, ...options }
        }

        options = await prompts.styleOptions(opts)
        opts = { ...opts, ...options }
    }

    return opts
}

function checkOpts(opts) {
    opts = Object.assign({}, opts)

    if (opts.backend === 'sqlite' && !opts.database) {
        opts.database = 'main'
    }

    if (opts.backend === 'sqlite' && !opts.dbFilename) {
        return bail(
            new Error(
                "You need to specify a database filename (--db-filename) when using the 'sqlite' backend"
            )
        )
    }

    if (!opts.interactive && !opts.database) {
        return bail(new Error('You need to specify a database (--database)'))
    }

    if (!opts.interactive && !opts.outputDir) {
        return bail(
            new Error(
                'You need to provide an output directory (--output-dir=<path>) to generate an application'
            )
        )
    }

    return opts
}

var adapter
async function instantiate(opts) {
    const sleep = promisify(setTimeout)

    try {
        // Do we support the given backend?
        let backend = backends(opts.backend)
        if (!backend) {
            return bail(new Error('Database backend "' + opts.backend + '" not supported'))
        }

        // Instantiate the adapter for the given backend
        adapter = backend(opts, function(err) {
            bailOnError(err)
        })

        await sleep(1000)

        let tableNames = await steps.getTables(adapter, opts)
        // If we're in interactive mode, prompt the user to select from the list of available tables
        if (opts.interactive) {
            tableNames = (await prompts.tableSelection(tableNames)).tables
        }

        // When tables have been selected, fetch data for those tables
        let data = {}
        data.tableStructure = await steps.tableStructure(adapter, { tables: tableNames })
        data.tableComments = await steps.tableComments(adapter, { tables: tableNames })

        await buildObjectRepresentation(data, opts)

        await steps.outputData(data, opts)

        return opts
    } catch (err) {
        bailOnError(err)
    }
}

// When table data has been collected, build an object representation of them
async function buildObjectRepresentation(data, opts) {
    let tableName,
        models = {},
        model
    for (tableName in data.tableStructure) {
        model = steps.tableToObject(
            {
                name: tableName,
                columns: data.tableStructure[tableName],
                comment: data.tableComments[tableName]
            },
            opts
        )

        models[model.name] = model
    }

    // Note: This mutates the models - sorry. PRs are welcome.
    data.models = steps.findReferences(models, opts)

    adapter.close()
}

// When the data has been written to stdout/files
function epilogue(opts) {
    if (!opts.outputDir) {
        return
    }

    if (opts.interactive) {
        console.log('\n\n\n')
    }

    const dir = path.resolve(opts.outputDir)
    console.log('Demo app generated in ' + dir + '. To run:')
    console.log('cd ' + dir)
    console.log('npm install')
    console.log('npm start')
    console.log()
    console.log('Then point your browser at http://localhost:4000/graphql')
}

function bail(err) {
    console.error(err.message ? err.message : err.toString())
    process.exit(1)
}

function bailOnError(err) {
    if (err) {
        throw err
        return bail(err)
    }
}
