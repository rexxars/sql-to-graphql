'use strict';

var adapters = {
    mysql: require('./mysql')
};

module.exports = function getBackendAdapter(db) {
    var backend = (db || '<not set>').toLowerCase();
    return adapters[backend];
};
