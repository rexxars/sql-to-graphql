var node = nodeDefinitions(
    function(globalId, ast) {
        var gid = fromGlobalId(globalId);
        var fieldKind = gid.id.match(/^[0-9]+$/) ? 'IntValue' : 'StringValue';
        var override = { arguments: [{ name: { value: 'id' }, value: { value: gid.id, kind: fieldKind } }] };
        return getEntityResolver(gid.type)(null, {}, ast, override);
    },
    function(data) {
        return data.__type;
    }
);

var nodeInterface = node.nodeInterface;
var nodeField = node.nodeField;
