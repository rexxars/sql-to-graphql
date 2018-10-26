'use strict';

var adapters = {
    mssql: require('./mssql'),
    mysql: require('./mysql'),
    postgres: require('./postgres'),
    pg: require('./postgres'),
    sqlite: require('./sqlite')
};

module.exports = function getBackendAdapter(db) {
    var backend = (db || '<not set>').toLowerCase();
    return adapters[backend];
};
