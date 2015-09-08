import knex from 'knex';
import config from './config/config';

var db;

export default function getDb() {
    return db || getDb.reconnect();
}

getDb.reconnect = function() {
    db = knex(config);
    return db;
};
