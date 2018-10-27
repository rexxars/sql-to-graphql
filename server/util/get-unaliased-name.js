'use strict';

module.exports = function getUnaliasedName(alias, aliases) {
    for (var key in aliases) {
        if (aliases[key] === alias) {
            return key;
        }
    }
};
