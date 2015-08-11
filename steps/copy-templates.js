'use strict';

var path = require('path');
var copy = require('copy-dir');

module.exports = function copyTemplates(type, toDir) {
    var fromDir = path.resolve(path.join(__dirname, '..', 'templates', type));
    var publicDir = path.resolve(path.join(__dirname, '..', 'templates', 'public'));
    copy.sync(fromDir, toDir);
    copy.sync(publicDir, path.join(toDir, 'public'));
};
