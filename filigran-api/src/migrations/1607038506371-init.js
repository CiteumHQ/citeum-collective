import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';

export const up = async (knex, db = bridgeSql(knex)) => {
  await db.execute(sql`
        CREATE TABLE "users"
        (
            id          VARCHAR(255) PRIMARY KEY,
            email       VARCHAR(255) UNIQUE,
            register_at timestamp
        );
        CREATE TABLE "associations"
        (
            id SERIAL  PRIMARY KEY,
            name VARCHAR(255) UNIQUE,
            register_at timestamp
        );
        INSERT INTO associations (name, register_at) VALUES ('Filigran', current_timestamp);
    `);
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
  //   await ctx.db.execute(sql`insert INTO users (id, email, register_at) values (${id}, ${email}, current_timestamp)`);
};
