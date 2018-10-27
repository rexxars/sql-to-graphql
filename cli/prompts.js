'use strict';

var inquirer = require('inquirer');
var merge = require('lodash/object/merge');

module.exports = {
    outputPath: function(cb) {
        prompt({
            message: 'Output path of the application',
            name: 'outputPath'
        }, cb);
    },

    styleOptions: function(opts, cb) {
        return inquirer.prompt([{
            type: 'confirm',
            name: 'relay',
            message: 'Do you want a Relay-style GraphQL schema?',
            default: opts.relay
        }], function(answers) {
            cb(merge({}, opts, answers));
        });
    },

    tableSelection: function(tables, cb) {
        prompt({
            type: 'checkbox',
            message: 'Select tables to include',
            name: 'tables',
            choices: [
                new inquirer.Separator('Available tables:')
            ].concat(tables.map(function(tbl) {
                return { name: tbl, checked: true };
            })),
            validate: function(selected) {
                if (selected.length < 1) {
                    return 'You must select at least one table.';
                }
                return true;
            }
        }, cb);
    },

    dbCredentials: function(opts, cb) {
        var prompts = [];

        if (!opts.backend || opts.backend === 'mysql') {
            prompts.push({
                type: 'list',
                name: 'backend',
                message: 'What kind of database is it?',
                choices: ['mysql', 'postgres'],
                default: 'mysql'
            });
        }

        if (!opts.host || opts.host === 'localhost') {
            prompts.push({
                message: 'What is the hostname of your database server?',
                name: 'host',
                validate: Boolean,
                default: 'localhost'
            });
        }

        if (!opts.database) {
            prompts.push({
                message: 'What is the name of the database?',
                name: 'database',
                validate: Boolean
            });
        }

        if (!opts.user || opts.user === 'root') {
            prompts.push({
                message: 'What is the database username?',
                name: 'user',
                validate: Boolean,
                default: 'root'
            });
        }

        if (!opts.password) {
            prompts.push({
                message: 'What is the database password?',
                name: 'password',
                type: 'password'
            });
        }

        inquirer.prompt(prompts, function(answers) {
            if (!opts.port || opts.port === 3306) {
                prompt({
                    message: 'What is the port number of the ' + answers.backend + ' database?',
                    name: 'port',
                    default: answers.backend === 'mysql' ? 3306 : 5432,
                    validate: function(num) {
                        num = parseInt(num, 10);
                        return !isNaN(num) && num > 0;
                    }
                }, function(port) {
                    cb(merge({}, answers, { port: port }));
                });
            }
        });
    }
};

function prompt(opts, cb) {
    return inquirer.prompt([opts], function(answers) {
        cb(answers[opts.name]);
    });
}
