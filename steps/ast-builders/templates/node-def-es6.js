const {nodeInterface, nodeField} = nodeDefinitions(
    function(globalId, ast) {
        var {type, id} = fromGlobalId(globalId);
        var fieldKind = id.match(/^[0-9]+$/) ? 'IntValue' : 'StringValue';
        var override = { arguments: [{ name: { value: 'id' }, value: { value: id, kind: fieldKind } }] };
        return getEntityResolver(type)(null, {}, ast, override);
    },
    data => data.__type
);