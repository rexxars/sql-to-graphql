# sql-to-graphql

Generate GraphQL schemas and/or server based on SQL table structure.

## What?

[https://facebook.github.io/graphql/](GraphQL) is pretty awesome, but getting started can be difficult - especially if you are unfamiliar with the concepts it introduces.

`sql-to-graphql` is a command-line utility that can help you get started. You give it the credentials to an SQL database (MySQL, PostgreSQL currently) and it will inspect the tables it finds and do one of the following:

- Generate a GraphQL-server based on Hapi
  - Set up a basic web-based playground that can query the server
- Print the proposed GraphQL schema as code

## Disclaimer

This utility is intended to help people get started with GraphQL. It is **NOT** intended to be used in production.

## Installation

`npm install -g sql-to-graphql`

## Usage

`sql2graphql <command> [options]`

### Commands:
  - `app` - Create a demo app based on Hapi that can be used to query the generated schema
  - `print` - Print the generated schema to console

### Options:
  
  - `--database`, `--db` - Database name *`(string [required])`*
  - `--host`, `-h` - Hostname of database server *`(string [default: "localhost"])`*
  - `--port`, `-P` - Port number of database server *`(number)`*
  - `--user`, `-u` - Username to use when connecting *`(string [default: "root"])`*
  - `--password`, `-p` - Password to use when connecting *`(string [default: ""])`*
  - `--table`, `-t` - Tables to generate type schemas for *`(array [default: "*"])`*
  - `--backend`, `-b` - Type of database *`(string [default: "mysql"])`*
  - `--relay`, `-r` - Generate Relay-style schema *`(boolean [default: false])`*
  - `--strip-suffix` - Remove a suffix from table names when generating types *`(array)`*
  - `--strip-prefix` - Remove a prefix from table names when generating types *`(array)`*
  - `--interactive`, `-i` - Interactive mode *`(boolean [default: false])`*
  - `--colors`, `-c` - Colorize the code output *`(boolean [default: false])`*
  - `--output-dir` - Directory to use when generating app (only used with `app` command) *`(string)`*
  - `--es6` - Use ES6 for generated code *`(boolean [default: false])`*
  - `--use-tabs` - Use tabs for indentation *`(boolean [default: false])`*
  - `--tab-width` - Width of tabs *`(number [default: 2])`*
  - `--quote` - Quote style (single/double) *`(string [default: "single"])`*
  - `--default-description` - The description to use for columns without a comment *`(string [default: "@TODO DESCRIBE ME"])`*
  - `--unaliased-primary-keys`  Disable aliasing of primary key fields to "id" for each type *`(boolean [default: false])`*
  - `--help` - Show help *`(boolean)`*

## License

MIT-licensed. See LICENSE.
