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
    stub: nconf.resolvePath('src/migrations/migration.js.stub'),
  },
};

const execute = (knexObj, sqlQuery) => knexObj.raw(sqlQuery.sql, sqlQuery.bindings);

const queryRows = async (knexObj, sqlQuery) => {
  const { rows } = await execute(knexObj, sqlQuery);
  return rows;
};

const queryOne = async (knexObj, sqlQuery) => {
  const rows = await queryRows(knexObj, sqlQuery);
  if (rows.length !== 1) {
    throw new Error(`Query result expected to return a single row but ${rows.length} rows received`);
  }
  return rows[0];
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

  // const originalTransaction = database.transaction;
  // database.transaction = async (...args) => {
  //   const trx = await originalTransaction.call(database, ...args);
  //   bridgeSql(trx, trx);
  //   return trx;
  // };

  database.contextualize = () => {
    let count = 0;
    const stacks = [];
    const onNewQuery = () => {
      count += 1;
      if (nconf.inDev) {
        stacks.push(new Error().stack);
      }
    };

    const dbProxy = new Proxy(database, {
      apply: (target, thisArg, args) => {
        onNewQuery();
        return target(...args);
      },
      get: (target, prop, receiver) => {
        if (
          prop === 'execute' ||
          prop === 'queryRows' ||
          prop === 'queryOne' ||
          prop === 'queryCount' ||
          prop === 'queryNumber'
        ) {
          onNewQuery();
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const stats = {
      count: () => count,
      stacks: () => stacks,
    };

    return [dbProxy, stats];
  };

  return database;
};
