'use strict';

var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
    method: 'POST',
    path: '/graphql',
    handler: require('./handlers/graphql'),
    config: {
        payload: {
            parse: false,
            allow: 'application/graphql'
        }
    }
});

server.route({
    method: 'GET',
    path: '/schema',
    handler: require('./handlers/schema-printer')
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public'
        }
    }
});

server.start(function() {
    console.log('Server running at:', server.info.uri);
});
