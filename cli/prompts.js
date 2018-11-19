'use strict'

var inquirer = require('inquirer')
var merge = require('lodash/merge')

module.exports = {
    outputPath: function() {
        return prompt({
            message: 'Output path of the application',
            name: 'outputPath'
        })
    },

    styleOptions: function(opts) {
        return inquirer.prompt([
            {
                type: 'confirm',
                name: 'relay',
                message: 'Do you want a Relay-style GraphQL schema?',
                default: opts.relay
            }
        ])
    },

    tableSelection: function(tables) {
        return prompt({
            type: 'checkbox',
            message: 'Select tables to include',
            name: 'tables',
            choices: [new inquirer.Separator('Available tables:')].concat(
                tables.map(function(tbl) {
                    return { name: tbl, checked: true }
                })
            ),
            validate: function(selected) {
                if (selected.length < 1) {
                    return 'You must select at least one table.'
                }
                return true
            }
        })
    },

    backend: function(opts) {
        if (!opts.backend || opts.backend === 'mysql') {
            return prompt({
                type: 'list',
                name: 'backend',
                message: 'What kind of database is it?',
                choices: ['mysql', 'postgres', 'mssql', 'sqlite'],
                default: 'mysql'
            })
        }
        return Promise.resolve({})
    },

    dbCredentials: function(opts) {
        var prompts = []

        if (opts.backend === 'sqlite') {
            prompts.push({
                name: 'dbFilename',
                message: 'What is the path to the sqlite file?'
            })
        } else {
            if (!opts.host || opts.host === 'localhost') {
                prompts.push({
                    message: 'What is the hostname of your database server?',
                    name: 'host',
                    validate: Boolean,
                    default: 'localhost'
                })
            }

            if (!opts.database) {
                prompts.push({
                    message: 'What is the name of the database?',
                    name: 'database',
                    validate: Boolean
                })
            }

            if (!opts.user || opts.user === 'root') {
                prompts.push({
                    message: 'What is the database username?',
                    name: 'user',
                    validate: Boolean,
                    default: 'root'
                })
            }

            if (!opts.password) {
                prompts.push({
                    message: 'What is the database password?',
                    name: 'password',
                    type: 'password'
                })
            }
        }

        return inquirer.prompt(prompts).then(answers => {
            if (opts.backend !== 'sqlite' && (!opts.port || opts.port === 3306)) {
                return prompt({
                    message: 'What is the port number of the ' + answers.backend + ' database?',
                    name: 'port',
                    default: answers.backend === 'mysql' ? 3306 : 5432,
                    validate: function(num) {
                        num = parseInt(num, 10)
                        return !isNaN(num) && num > 0
                    }
                }).then(port => merge({}, answers, { port: port }))
            }

            return answers
        })
    }
}

async function prompt(question) {
    return inquirer.prompt([question]) //.then(answers => answers[opts.name])
}
