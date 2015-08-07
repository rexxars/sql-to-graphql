'use strict';

var capitalize = require('lodash/string/capitalize');
var snakeCase = require('lodash/string/snakeCase');
var b = require('ast-types').builders;
var buildVar = require('./ast-builders/variable');
var buildResolver = require('./ast-builders/resolver');

var typeMap = {
    'string': 'GraphQLString',
    'integer': 'GraphQLInt',
    'float': 'GraphQLFloat'
};

function generateTypes(data, opts) {
    var types = {}, typesUsed;
    for (var typeName in data.models) {
        typesUsed = [];
        types[typeName] = generateType(typeName, data.models[typeName]);
        types[typeName].imports = typesUsed;
        types[typeName].varName = typeName + 'Type';
        types[typeName].name = typeName;
    }

    return types;

    function addUsedType(type) {
        if (typesUsed.indexOf(type) === -1) {
            typesUsed.push(type);
        }
    }

    function generateType(name, model) {
        var fields = [], fieldNames = Object.keys(model.fields);
        for (var fieldName in model.fields) {
            fields.push(generateField(model.fields[fieldName]));

            if (model.references[fieldName]) {
                fields.push(generateReferenceField(
                    fieldName,
                    model.references[fieldName],
                    fieldNames
                ));
            }
        }

        var typeDeclaration = b.objectExpression([
            b.property('init', b.identifier('name'), b.literal(name)),
            generateDescription(model.description),
            b.property(
                'init',
                b.identifier('fields'),
                buildFieldWrapperFunc(name, b.objectExpression(fields))
            )
        ]);

        return {
            ast: buildVar(
                name + 'Type',
                b.newExpression(
                    b.identifier('GraphQLObjectType'),
                    [typeDeclaration]
                ),
                opts.es6
            )
        };
    }

    function buildFieldWrapperFunc(name, fields) {
        if (opts.es6) {
            return b.arrowFunctionExpression([], fields);
        }

        return b.functionExpression(
            b.identifier('get' + name + 'Fields'),
            [],
            b.blockStatement([
                b.returnStatement(
                    fields
                )
            ])
        );
    }

    function generateDescription(description) {
        return b.property(
            'init',
            b.identifier('description'),
            b.literal(description || opts.defaultDescription)
        );
    }

    function generateField(field, type) {
        var props = [
            b.property('init', b.identifier('type'), type || getType(field)),
            generateDescription(field.description)
        ];

        if (field.resolve) {
            props.push(b.property('init', b.identifier('resolve'), field.resolve));
        }

        return b.property(
            'init',
            b.identifier(field.name),
            b.objectExpression(props)
        );
    }

    function generateReferenceField(refName, refersTo, otherFields) {
        var fieldName = refName.replace(/Id$/, '');

        // If we collide with a different field name, add a "Ref"-suffix
        if (otherFields.indexOf(fieldName) !== -1) {
            fieldName += 'Ref';
        }

        var description = opts.defaultDescription;
        if (fieldName.indexOf('parent') === 0) {
            description += ' (parent ' + refersTo.name.toLowerCase() + ')';
        } else {
            description += ' (reference)';
        }

        var refTypeName = refersTo.name + 'Type';
        addUsedType(refTypeName);

        return generateField({
            name: fieldName,
            description: description,
            resolve: buildResolver(refersTo, data)
        }, b.identifier(refTypeName));
    }

    function getType(field) {
        if (field.type === 'enum') {
            addUsedType('GraphQLEnumType');
            return getEnum(field);
        }

        var type = typeMap[field.type];
        var identifier = b.identifier(type);

        addUsedType(type);

        if (!field.isNullable) {
            addUsedType('GraphQLNonNull');
            return b.newExpression(b.identifier('GraphQLNonNull'), [identifier]);
        }

        return identifier;
    }

    function getEnum(field) {
        var values = [], enumValue;
        for (var name in field.values) {
            enumValue = field.values[name];
            values.push(b.property(
                'init',
                b.identifier(snakeCase(name).toUpperCase()),
                b.objectExpression([
                    b.property('init', b.identifier('value'), b.literal(enumValue.value)),
                    generateDescription(enumValue.description)
                ])
            ));
        }

        var typeDeclaration = b.objectExpression([
            b.property('init', b.identifier('name'), b.literal(capitalize(field.name))),
            generateDescription(field.description),
            b.property('init', b.identifier('values'), b.objectExpression(values))
        ]);

        return b.newExpression(
            b.identifier('GraphQLEnumType'),
            [typeDeclaration]
        );
    }
}

module.exports = generateTypes;
