import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';
import { createDocumentType } from '../domain/associations';

export const up = async (knex, db = bridgeSql(knex)) => {
  // Create documents structure
  await db.execute(sql`
        CREATE TABLE "document_type"
        (
            id              VARCHAR(255) PRIMARY KEY,
            icon            VARCHAR(255),
            description     text
        );
        CREATE TABLE "documents"
        (
          id              VARCHAR(255) PRIMARY KEY,
          name            VARCHAR(255),
          description     text,
          type            VARCHAR(255),
          created_at      timestamp DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_document_type
            FOREIGN KEY (type)
              REFERENCES document_type (id)
        );
        CREATE TABLE "documents_memberships"
        (
            document        VARCHAR(255),
            membership      VARCHAR(255),
            UNIQUE (document, membership),
            CONSTRAINT fk_document
              FOREIGN KEY (document)
                REFERENCES documents (id),
            CONSTRAINT fk_membership
              FOREIGN KEY (membership)
                REFERENCES memberships (id)
        );
    `);
  // Create basic types
  await createDocumentType({ db }, 'MINUTES', 'SettingsRemote', 'Communications');
  await createDocumentType({ db }, 'INFORMATION', 'Description', 'Documents');
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
