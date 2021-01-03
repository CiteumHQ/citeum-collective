import knex from 'knex';
import pg from 'pg';
import { rdsRootCA } from '../config/certificates';
import nconf, { logger } from '../config/conf';

// On Windows, default timestamp is not properly managed
// to handle SQL dates, we override the parse function to return a String instead of a date
pg.types.setTypeParser(1082, (value) => value);

export const knexConfig = {
  client: 'pg',
  debug: false,
  connection: {
    host: nconf.get('database:host'),
    port: nconf.get('database:port'),
    user: nconf.get('database:user'),
    password: nconf.get('database:password'),
    database: nconf.get('database:base'),
    ssl: nconf.get('database:db_ssl')
      ? {
          ca: rdsRootCA,
          rejectUnauthorized: true,
        }
      : false,
  },
  pool: {
    afterCreate: (connection, callback) => {
      connection.query('SET timezone = "UTC";', (err) => {
        callback(err, connection);
      });
    },
    min: nconf.get('database:pool:min') || 2,
    max: nconf.get('database:pool:max') || 10,
  },
  migrations: {
    tableName: 'migrations',
    directory: nconf.resolvePath('src/migrations'),
    stub: nconf.resolvePath('src/utils/migration-template.js'),
  },
};

const execute = (knexObj, sqlQuery) => knexObj.raw(sqlQuery.sql, sqlQuery.bindings);

const queryRows = async (knexObj, sqlQuery) => {
  const { rows } = await execute(knexObj, sqlQuery);
  return rows;
};

const queryOne = async (knexObj, sqlQuery) => {
  const rows = await queryRows(knexObj, sqlQuery);
  if (rows.length > 1) {
    throw new Error(`Query result expected to return a single row but ${rows.length} rows received`);
  }
  return rows && rows[0];
};

const queryCount = async (knexObj, sqlQuery) => {
  const row = await queryOne(knexObj, sqlQuery);
  return parseInt(row.count, 10);
};

const queryNumber = async (knexObj, sqlQuery, key) => {
  const row = await queryOne(knexObj, sqlQuery);
  return parseInt(row[key], 10);
};

export const bridgeSql = (knexObj, target = {}) =>
  Object.assign(target, {
    execute: (sqlQuery) => execute(knexObj, sqlQuery),
    queryRows: (sqlQuery) => queryRows(knexObj, sqlQuery),
    queryOne: (sqlQuery) => queryOne(knexObj, sqlQuery),
    queryCount: (sqlQuery) => queryCount(knexObj, sqlQuery),
    queryNumber: (sqlQuery, key) => queryNumber(knexObj, sqlQuery, key),
  });

export const connectDatabase = () => {
  const database = knex({
    ...knexConfig,
    // log methods are only overridden when not using knex CLI
    log: {
      deprecate: (method, alternative) =>
        logger.error('Method is deprecated, please use alternative', { method, alternative }),
      debug: logger.debug,
      warn: logger.warn,
      error: logger.error,
    },
  });

  bridgeSql(database, database);

  const originalTransaction = database.transaction;
  // Object.defineProperty must be used instead of database.transaction assignation since https://github.com/knex/knex/pull/3717/files#diff-a3c5ee73d04684a19f3b2beb31b5c47e
  Object.defineProperty(database, 'transaction', {
    value: async (...args) => {
      const trx = await originalTransaction.call(database, ...args);
      bridgeSql(trx, trx);
      return trx;
    },
    configurable: true,
  });
  return database;
};

export const db = connectDatabase();
