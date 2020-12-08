import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';
import conf, { MAIN_ASSOCIATION_ID } from '../config/conf';

export const up = async (knex, db = bridgeSql(knex)) => {
  const associationName = conf.get('keycloak:base_realm');
  // Create structure
  await db.execute(sql`
        CREATE TABLE "users"
        (
            id          VARCHAR(255) PRIMARY KEY,
            email       VARCHAR(255) UNIQUE,
            register_at timestamp
        );
        CREATE TABLE "associations"
        (
            id          VARCHAR(255) PRIMARY KEY,
            name        VARCHAR(255) UNIQUE,
            register_at timestamp
        );
    `);
  // Provide data
  await db.execute(
    sql`INSERT INTO associations (id, name, register_at) VALUES (${MAIN_ASSOCIATION_ID}, ${associationName}, current_timestamp)`
  );
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
