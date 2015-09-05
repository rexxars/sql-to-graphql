'use strict';

var knex = require('knex');
var config = require('./config/config');
var db;

function getDb() {
    return db || getDb.reconnect();
}

getDb.reconnect = function() {
    db = knex(config);
    return db;
};

module.exports = getDb;
