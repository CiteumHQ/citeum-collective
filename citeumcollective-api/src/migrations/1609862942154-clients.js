import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Create documents structure
  await db.execute(sql`
        CREATE TABLE "applications_clients"
        (
            association            VARCHAR(255),
            application            VARCHAR(255),
            keycloak_client_id     VARCHAR(255),
            UNIQUE (application, keycloak_client_id),
            CONSTRAINT fk_application_id
              FOREIGN KEY (application)
                REFERENCES applications (id),
            CONSTRAINT fk_association_id
              FOREIGN KEY (association)
                REFERENCES associations (id)
        );
    `);
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
