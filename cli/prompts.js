'use strict';

var inquirer = require('inquirer');

module.exports = {
    tableSelection: function(tables, cb) {
        prompt({
            type: 'checkbox',
            message: 'Select tables for include',
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
    }
};

function prompt(opts, cb) {
    return inquirer.prompt([opts], function(answers) {
        cb(answers[opts.name]);
    });
}
