import { bridgeSql } from '../database/postgre';
import { sql } from '../utils/sql';
import conf from '../config/conf';
import { createAssociation } from '../domain/associations';
import { kcGetUserByName } from '../database/keycloak';
import { createMembership } from '../domain/memberships';

export const up = async (knex, db = bridgeSql(knex)) => {
  const admin = await kcGetUserByName(conf.get('association:admin'));
  // Create structure
  await db.execute(sql`
        CREATE TABLE "users"
        (
            id                VARCHAR(255) PRIMARY KEY,
            email             VARCHAR(255) UNIQUE,
            address           text,
            organization      VARCHAR(255),
            birthday          timestamp DEFAULT CURRENT_TIMESTAMP,
            job_position      VARCHAR(255),
            is_organization   BOOLEAN NOT NULL,
            organization_logo text,
            register_at       timestamp DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "associations"
        (
            id          VARCHAR(255) PRIMARY KEY,
            code        VARCHAR(255) UNIQUE,
            name        VARCHAR(255) UNIQUE,
            description VARCHAR(255) UNIQUE,
            email       VARCHAR(255) UNIQUE,
            website     VARCHAR(255) UNIQUE,
            register_at timestamp  DEFAULT CURRENT_TIMESTAMP,
            default_membership VARCHAR(255) NOT NULL
        );
        CREATE TABLE "memberships"
        (
            id              VARCHAR(255) PRIMARY KEY,
            code            VARCHAR(255),
            fee             INTEGER NOT NULL,
            color           VARCHAR(7),
            name            VARCHAR(255),
            description     VARCHAR(255),
            association_id  VARCHAR(255) NOT NULL,
            UNIQUE (code, association_id),
            CONSTRAINT fk_association
              FOREIGN KEY (association_id)
                REFERENCES associations (id)
        );
        CREATE TABLE "users_memberships"
        (
            membership         VARCHAR(255) NOT NULL,
            association        VARCHAR(255) NOT NULL,
            CONSTRAINT associations_default_memberships_association_key
              UNIQUE (association),
            CONSTRAINT associations_default_memberships_association_fkey
              FOREIGN KEY (association)
                REFERENCES associations (id),
            CONSTRAINT associations_default_memberships_membership_fkey
              FOREIGN KEY (membership)
                REFERENCES memberships (id)                
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
        CREATE TABLE "users_memberships"
        (
            account            VARCHAR(255) NOT NULL,
            membership         VARCHAR(255) NOT NULL,
            association        VARCHAR(255) NOT NULL,
            role               VARCHAR(255) NOT NULL,
            subscription_date timestamp,
            subscription_last_update timestamp,
            subscription_next_update timestamp,          
            CONSTRAINT users_memberships_account_membership_association_key
              UNIQUE (account, membership, association),
            CONSTRAINT users_memberships_association_fkey
              FOREIGN KEY (association)
                REFERENCES associations (id),
            CONSTRAINT users_memberships_membership_fkey
              FOREIGN KEY (membership)
                REFERENCES memberships (id),
            CONSTRAINT users_memberships_user_fkey
              FOREIGN KEY (account)
                REFERENCES users (id)                           
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
  await createMembership({ db }, { associationId: association.id, name: 'Supporter', code: 'supporter', fee: 0 });
};

// eslint-disable-next-line no-unused-vars
export const down = async (knex, db = bridgeSql(knex)) => {
  // Nothing to do
};
