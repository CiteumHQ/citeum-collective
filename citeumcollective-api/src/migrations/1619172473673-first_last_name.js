import { sql } from '../utils/sql';
import { bridgeSql } from '../database/postgre';
import { getUsers } from '../domain/users';
import { kcGetUserInfo } from '../database/keycloak';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Add attribute to users table
  await db.execute(sql`
    ALTER TABLE "users"
    ADD first_name VARCHAR(255),
    ADD last_name VARCHAR(255);
  `);
  // Fill the attributes
  const users = await getUsers({ db });
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const { firstName, lastName } = await kcGetUserInfo(user.id);
    await db.execute(sql`UPDATE users SET first_name = ${firstName}, last_name = ${lastName} WHERE id = ${user.id}`);
  }
};

export const down = async (knex, db = bridgeSql(knex)) => {
  await db.execute(sql`
    ALTER TABLE "users"
      DROP first_name,
      DROP last_name; 
  `);
};
