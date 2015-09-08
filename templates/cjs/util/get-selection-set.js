'use strict';

var getUnaliasedName = require('./get-unaliased-name');

module.exports = function getSelectionSet(type, ast, aliases, referenceMap) {
    if (!ast || !ast.selectionSet) {
        return [];
    }

    return ast.selectionSet.selections.reduce(function reduceSelectionSet(set, selection) {
        // If we encounter a selection with a type condition, make sure it's the correct type
        if (selection.typeCondition && selection.typeCondition.name.value !== type) {
            return set;
        }

        var alias, field;
        if (selection.kind === 'Field' && selection.selectionSet && referenceMap) {
            // For fields with its own selection set, we need to fetch the reference ID
            alias = referenceMap[selection.name.value];
            field = getUnaliasedName(alias, aliases);
            if (field || alias) {
                set.push(field || alias);
            }
            return set;
        } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
            // And for inline fragments, we need to recurse down and combine the set
            return set.concat(getSelectionSet(type, selection, aliases, referenceMap));
        } else if (selection.selectionSet) {
            return set;
        }

        alias = selection.name.value;
        field = getUnaliasedName(alias, aliases);
        set.push(field ? field + ' AS ' + alias : alias);
        return set;
    }, []);
};
