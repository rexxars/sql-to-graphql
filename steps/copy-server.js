'use strict';

var copy = require('copy-dir');
var path = require('path');

module.exports = function copyServer( toDir) {
    var fromDir = path.resolve(path.join(__dirname, '..', 'server'));
    copy.sync(fromDir, toDir);
};
