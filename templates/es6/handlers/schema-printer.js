import { printSchema } from 'graphql/utilities/schemaPrinter';
import schema from '../schema';

export default function schemaPrintHandler(request, reply) {
    reply(printSchema(schema));
}
