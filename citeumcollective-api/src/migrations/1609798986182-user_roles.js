import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';
import { createRole } from '../domain/users';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Create documents structure
  await db.execute(sql`
        CREATE TABLE "roles"
        (
            name            VARCHAR(255) PRIMARY KEY,
            description     text
        );
        CREATE TABLE "users_roles"
        (
            user_id         VARCHAR(255) NOT NULL,
            role_name       VARCHAR(255) NOT NULL,
            association_id  VARCHAR(255) NOT NULL,
            UNIQUE (user_id, role_name, association_id),
            CONSTRAINT fk_user_id
              FOREIGN KEY (user_id)
                REFERENCES users (id),
            CONSTRAINT fk_role_name
              FOREIGN KEY (role_name)
                REFERENCES roles (name),
            CONSTRAINT fk_association_id
              FOREIGN KEY (association_id)
                REFERENCES associations (id)
        );
    `);
  await createRole({ db }, 'admin', 'Admin role');
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
