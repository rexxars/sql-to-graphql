'use strict';

module.exports = require('yargs')
    .usage('Usage: $0 [options]')
    .option('database', {
        alias: 'db',
        describe: 'Database name',
        type: 'string'
    })
    .option('host', {
        alias: 'h',
        describe: 'Hostname of database server',
        type: 'string',
        default: 'localhost'
    })
    .option('port', {
        alias: 'P',
        describe: 'Port number of database server',
        type: 'number',
        default: 3306
    })
    .option('user', {
        alias: 'u',
        describe: 'Username to use when connecting',
        type: 'string',
        default: 'root'
    })
    .option('password', {
        alias: 'p',
        describe: 'Password to use when connecting',
        type: 'string',
        default: ''
    })
    .option('table', {
        alias: 't',
        describe: 'Tables to generate type schemas for',
        type: 'array',
        default: '*'
    })
    .option('backend', {
        alias: 'b',
        describe: 'Type of database (mysql, postgres)',
        type: 'string',
        default: 'mysql'
    })
    .option('relay', {
        alias: 'r',
        describe: 'Generate Relay-style schema',
        type: 'boolean'
    })
    .option('strip-suffix', {
        describe: 'Remove a suffix from table names when generating',
        type: 'array'
    })
    .option('strip-prefix', {
        describe: 'Remove a prefix from table names when generating',
        type: 'array'
    })
    .option('interactive', {
        alias: 'i',
        describe: 'Interactive mode (prompt for confirmations)',
        type: 'boolean',
        default: false
    })
    .option('output-dir', {
        alias: 'o',
        describe: 'Print output into separate files within the given directory',
        type: 'string'
    })
    .option('es6', {
        describe: 'Output in ES6 format (const, import et all)',
        type: 'boolean',
        default: false
    })
    .option('use-tabs', {
        describe: 'Use tabs for indentation',
        type: 'boolean',
        default: false
    })
    .option('tab-width', {
        describe: 'Width of tabs',
        type: 'number',
        default: 4
    })
    .option('quote', {
        describe: 'Quote style (single/double)',
        type: 'string',
        default: 'single'
    })
    .option('default-description', {
        describe: 'The description to use for columns without a comment',
        type: 'string',
        default: '@TODO DESCRIBE ME'
    })
    .option('unaliased-primary-keys', {
        describe: 'Disable aliasing of primary key fields to "id" for each type',
        type: 'boolean',
        default: false
    })
    .help('help')
    .argv;
