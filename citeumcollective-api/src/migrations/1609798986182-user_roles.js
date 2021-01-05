// eslint-disable-next-line no-unused-vars
import { bridgeSql } from '../database/postgre';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};

export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
