'use strict';

var log = require('../util/log');

function findReferences(models) {
    for (var type in models) {
        models[type].references = findReferencesForModel(models[type], models);
    }

    return models;
}

function findReferencesForModel() {
    return [];
}

module.exports = findReferences;
