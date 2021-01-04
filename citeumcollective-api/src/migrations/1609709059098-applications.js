import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Create documents structure
  await db.execute(sql`
        CREATE TABLE "products"
        (
            id              VARCHAR(255) PRIMARY KEY,
            name            VARCHAR(255),
            description     text,
            association_id  VARCHAR(255) NOT NULL,
            created_at      timestamp DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (name, association_id),
            CONSTRAINT fk_association_id
              FOREIGN KEY (association_id)
                REFERENCES associations (id)
        );
        CREATE TABLE "applications"
        (
            id              VARCHAR(255) PRIMARY KEY,
            name            VARCHAR(255),
            description     text,
            uri             text,
            product_id      VARCHAR(255) NOT NULL,
            created_at      timestamp DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (name, product_id),
            CONSTRAINT fk_product_id
              FOREIGN KEY (product_id)
                REFERENCES products (id)
        );
        CREATE TABLE "applications_memberships"
        (
            document        VARCHAR(255),
            application     VARCHAR(255),
            UNIQUE (document, application),
            CONSTRAINT fk_document
              FOREIGN KEY (document)
                REFERENCES documents (id),
            CONSTRAINT fk_application
              FOREIGN KEY (application)
                REFERENCES applications (id)
        );
    `);
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
