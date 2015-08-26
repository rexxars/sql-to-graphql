'use strict';

var find = require('lodash/collection/find');
var where = require('lodash/collection/where');
var capitalize = require('lodash/string/capitalize');
var snakeCase = require('lodash/string/snakeCase');
var b = require('ast-types').builders;
var buildVar = require('./ast-builders/variable');
var buildResolver = require('./ast-builders/resolver');
var buildFieldWrapperFunction = require('./ast-builders/field-wrapper-function');

var typeMap = {
    'id': 'GraphQLID',
    'string': 'GraphQLString',
    'integer': 'GraphQLInt',
    'float': 'GraphQLFloat',
    'boolean': 'GraphQLBoolean'
};

function generateTypes(data, opts) {
    var types = {}, typesUsed;
    for (var typeName in data.models) {
        typesUsed = [];
        types[typeName] = generateType(typeName, data.models[typeName]);
        types[typeName].varName = typeName + 'Type';
        types[typeName].name = typeName;
        types[typeName].imports = typesUsed.filter(function(type) {
            return type !== types[typeName].varName;
        });
    }

    return types;

    function addUsedType(type) {
        if (typesUsed.indexOf(type) === -1) {
            typesUsed.push(type);
        }
    }

    function generateType(name, model) {
        var fields = [], ref;
        for (var fieldName in model.fields) {
            fields.push(generateField(model.fields[fieldName], null, name, model));

            ref = find(model.references, { refField: fieldName });
            if (ref) {
                fields.push(generateReferenceField(model.fields[fieldName], ref));
            }
        }

        where(model.references, { refField: null }).forEach(function(reference) {
            fields.push(generateListReferenceField(reference));
        });

        var interfaces = opts.relay && b.property(
            'init',
            b.identifier('interfaces'),
            b.arrayExpression([b.identifier('nodeInterface')])
        );

        var typeDeclaration = b.objectExpression([
            b.property('init', b.identifier('name'), b.literal(name)),
            generateDescription(model.description),
            b.property(
                'init',
                b.identifier('fields'),
                buildFieldWrapperFunction(name, b.objectExpression(fields), opts)
            )
        ].concat(interfaces || []));

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

    function generateDescription(description) {
        return b.property(
            'init',
            b.identifier('description'),
            b.literal(description || opts.defaultDescription)
        );
    }

    function generateField(field, type, parentName, parentModel) {
        if (field.isPrimaryKey && opts.relay) {
            return b.property('init', b.identifier('id'), b.callExpression(
                b.identifier('globalIdField'),
                [b.literal(parentName)]
            ));
        }

        var props = [
            b.property('init', b.identifier('type'), type || getType(field, parentModel)),
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

    function generateReferenceField(refField, refersTo) {
        var description = opts.defaultDescription;
        if (refersTo.field.indexOf('parent') === 0) {
            description += ' (parent ' + refersTo.model.name.toLowerCase() + ')';
        } else {
            description += ' (reference)';
        }

        return generateField({
            name: refersTo.field,
            description: description,
            resolve: buildResolver(refersTo.model, refField.originalName)
        }, b.callExpression(
            b.identifier('getType'),
            [b.literal(refersTo.model.name)]
        ));
    }

    function generateListReferenceField(reference) {
        addUsedType('GraphQLList');
        return generateField({
            name: reference.field,
            description: reference.description || opts.defaultDescription + ' (reference)',
            resolve: buildResolver(reference.model, find(reference.model.fields, { isPrimaryKey: true }).originalName)
        }, b.newExpression(
            b.identifier('GraphQLList'),
            [b.callExpression(b.identifier('getType'), [b.literal(reference.model.name)])]
        ));
    }

    function getType(field, model) {
        if (field.type === 'enum') {
            addUsedType('GraphQLEnumType');
            return getEnum(field, model);
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

    function getEnum(field, model) {
        var values = [], enumValue;
        for (var name in field.values) {
            enumValue = field.values[name];
            values.push(b.property(
                'init',
                b.literal(snakeCase(name).toUpperCase()),
                b.objectExpression([
                    b.property('init', b.identifier('value'), b.literal(enumValue.value)),
                    generateDescription(enumValue.description)
                ])
            ));
        }

        var typeDeclaration = b.objectExpression([
            b.property('init', b.identifier('name'), b.literal(model.name + capitalize(field.name))),
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
