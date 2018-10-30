'use strict'

var copy = require('copy-dir')
var path = require('path')

module.exports = function copyServer(module_type, toDir) {
    var fromDir = path.resolve(
        path.join(__dirname, '..', 'server', module_type)
    )
    copy.sync(fromDir, toDir)
}
