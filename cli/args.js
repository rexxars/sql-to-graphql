'use strict';

module.exports = require('yargs')
    .usage('Usage: $0 [options]')
    .option('database', {
        alias: 'db',
        demand: true,
        describe: 'Database name',
        type: 'string'
    })
    .option('host', {
        alias: 'h',
        describe: 'Hostname of database server',
        type: 'string',
        'default': 'localhost'
    })
    .option('port', {
        alias: 'P',
        describe: 'Port number of database server',
        type: 'number',
        'default': 3306
    })
    .option('user', {
        alias: 'u',
        describe: 'Username to use when connecting',
        type: 'string',
        'default': 'root'
    })
    .option('password', {
        alias: 'p',
        describe: 'Password to use when connecting',
        type: 'string',
        'default': ''
    })
    .option('table', {
        alias: 't',
        describe: 'Tables to generate type schemas for',
        type: 'array',
        'default': '*'
    })
    .option('backend', {
        alias: 'b',
        describe: 'Type of database',
        type: 'string',
        'default': 'mysql'
    })
    .option('strip-suffix', {
        alias: 's',
        describe: 'Remove a suffix from table names when generating',
        type: 'array'
    })
    .option('interactive', {
        alias: 'i',
        describe: 'Interactive mode (prompt for confirmations)',
        type: 'boolean',
        'default': false
    })
    .help('help')
    .argv;
