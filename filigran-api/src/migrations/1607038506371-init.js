import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';

export const up = async (knex, db = bridgeSql(knex)) => {
  await db.execute(sql`
        CREATE TABLE "users"
        (
            email VARCHAR(255),
            register_at timestamp,
            PRIMARY KEY (email)
        )
    `);
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
