import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';
import conf from '../config/conf';
import { createAssociation } from '../domain/associations';
import { getUserByName } from '../database/keycloak';
import { createMembership } from '../domain/memberships';

export const up = async (knex, db = bridgeSql(knex)) => {
  const admin = await getUserByName(conf.get('association:admin'));
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
            code        VARCHAR(255) UNIQUE,
            name        VARCHAR(255) UNIQUE,
            description VARCHAR(255) UNIQUE,
            email       VARCHAR(255) UNIQUE,
            register_at timestamp
        );
        CREATE TABLE "memberships"
        (
            id              VARCHAR(255) PRIMARY KEY,
            code            VARCHAR(255),
            name            VARCHAR(255),
            description     VARCHAR(255),
            association_id  VARCHAR(255) NOT NULL,
            UNIQUE (code, association_id),
            CONSTRAINT fk_association
              FOREIGN KEY (association_id)
                REFERENCES associations (id)
        );
        CREATE TABLE "notifications"
        (
            id          VARCHAR(255) PRIMARY KEY,
            date        timestamp,
            type        VARCHAR(255),
            content     text,
            association_id  VARCHAR(255) NOT NULL,
            CONSTRAINT fk_association
              FOREIGN KEY (association_id)
                REFERENCES associations (id)
        );
    `);
  // Provide data
  // 01- Create default association
  const associationName = conf.get('association:name');
  const associationCode = conf.get('association:identifier');
  const associationEmail = conf.get('association:email');
  const asso = {
    name: associationName,
    description: 'Open Source solutions of general interest',
    email: associationEmail,
    code: associationCode,
  };
  const association = await createAssociation({ db, user: admin }, asso);
  // 02- Create default membership
  await createMembership({ db }, { associationId: association.id, name: 'Supporter', code: 'supporter' });
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
