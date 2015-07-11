'use strict';

var util = require('util');

function log() {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(item) {
        console.log(util.inspect(item, { depth: 5, colors: true }));
    });
}

module.exports = log;
