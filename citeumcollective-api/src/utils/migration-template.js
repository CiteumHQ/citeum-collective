import { sql } from './sql';
import { bridgeSql } from '../database/postgre';

export const up = async (knex, db = bridgeSql(knex)) => {
  await db.execute(sql`
      -- TODO insert upgrade migration SQL script
  `);
};

export const down = async (knex, db = bridgeSql(knex)) => {
  await db.execute(sql`
      -- TODO insert downgrade migration SQL script
  `);
};
