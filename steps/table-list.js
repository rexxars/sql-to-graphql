'use strict';

var diff = require('lodash/difference');

// Get available tables/verify specified tables
module.exports = function getTableList(adapter, opts, cb) {
    var tableList = opts.table;
    adapter.getTables(tableList, function(err, tables) {
        if (err) {
            return cb(err);
        }

        // Check for missing tables
        var matchAll = tableList.length === 1 && tableList[0] === '*';
        if (!matchAll && tableList.length !== tables.length) {
            return cb(new Error(
                'Did not find specified table(s): ' + diff(tableList, tables).join(', ')
            ));
        }

        cb(null, tables);
    });
};
