import Boom from 'boom';
import { graphql } from 'graphql';
import schema from '../schema';

export default function graphqlHandler(request, reply) {
    const payload = (request.payload || '').toString();
    graphql(schema, payload).then(function(result) {
        if (result.errors) {
            logErrors(result.errors);

            return reply(Boom.badRequest(
                result.errors.reduce(reduceErrors, [])
            ));
        }

        return reply(result);
    });
}

function reduceErrors(errs, err) {
    // Hacky, but knex sucks at errors and graphql swallows errors.
    const isDbErr = err.message.indexOf('Pool') === 0;

    errs.push((isDbErr ? '[Database] ' : '') + err.message);
    return errs;
}

function logErrors(errs) {
    errs.forEach(function(err) {
        console.log(err.message);

        if (err.stack) {
            console.log(err.stack);
        }
    });
}
