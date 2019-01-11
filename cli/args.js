'use strict'

module.exports = require('yargs')
  .usage('Usage: $0 [options]')
  .option('database', {
    alias: 'db',
    describe: 'Database name',
    type: 'string'
  })
  .option('db-filename', {
    describe: 'full path to the sqlite db file',
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
    describe: 'Type of database (mysql, postgres, sqlite, mssql)',
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
  .option('rel', {
    describe: 'Relationship detection method - colids or backend',
    type: 'string',
    default: 'colids'
  })
  .option('schemas', {
    alias: 's',
    describe: 'Selected schemas for mssql: * or comma-separated list',
    type: 'string',
    default: 'dbo'
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
  .help('help').argv
