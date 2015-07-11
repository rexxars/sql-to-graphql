'use strict';

var async = require('async');

function getTableComments(adapter, opts, cb) {
    var tables = opts.tables.reduce(function(map, tbl) {
        map[tbl] = getTableCommentTask(adapter, tbl);
        return map;
    }, {});

    async.parallel(tables, cb);
}

function getTableCommentTask(adapter, tblName) {
    return function getTableComment(cb) {
        adapter.getTableComment(tblName, cb);
    };
}

module.exports = getTableComments;
