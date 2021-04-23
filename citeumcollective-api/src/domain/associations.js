import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import { sql } from '../utils/sql';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from '../database/constants';
import { assignUserMembership, createMembership, getAssociationById } from './memberships';
import { FunctionalError } from '../config/errors';
import { createNotification } from './notifications';
import { grantRoleToUser } from './roles';
import { ADMIN_ROLE_CODE, kcDeleteAssociationRoles } from '../database/keycloak';
// eslint-disable-next-line import/no-cycle
import { getUsers } from './users';

export const getAssociations = (ctx) => {
  return ctx.db.queryRows(sql`select * from associations`);
};

export const getAssociationByCode = (ctx, code) => {
  return ctx.db.queryOne(sql`select * from associations where code = ${code}`);
};

const associationsRelatedToUser = async (ctx, user) => {
  const userRoles = user.roles || [];
  const assoCodes = R.uniq(
    userRoles
      .filter((f) => f.startsWith(ROLE_ASSO_PREFIX))
      .map((a) => {
        const [, associationCode, membershipCode] = a.split(ROLE_ASSO_SEPARATOR);
        return { associationCode, membershipCode };
      })
  );
  if (assoCodes.length === 0) return [];
  return ctx.db.queryRows(sql`SELECT id, code, name, description, email from associations 
        where code in (${sql.bindings(assoCodes.map((a) => a.associationCode))})
        order by name`);
};

export const getAssociationDefaultMembership = async (ctx, association) => {
  const defaultMembership = await ctx.db.queryOne(
    sql`select * from associations_default_memberships where association = ${association.id}`
  );
  return defaultMembership.membership;
};

export const userAssociations = async (ctx, user) => associationsRelatedToUser(ctx, user);

const ship = (e) => ({ id: `${e.user_id}_${e.membership_id}`, ...e });
export const userSubscriptions = async (ctx, user) => {
  const subscriptions = await ctx.db.queryRows(
    sql`select role, subscription_date, subscription_last_update, subscription_next_update, 
               account as user_id, membership as membership_id, association as association_id from users_memberships 
               where account = ${user.id}`
  );
  // noinspection UnnecessaryLocalVariableJS
  const data = subscriptions.map((s) => ship(s));
  return data;
};

export const isDocumentAccessibleFromUser = async (ctx, user, document) => {
  const userOrganisationMemberships = await userSubscriptions({ ...ctx, user }, user);
  const userMemberships = userOrganisationMemberships.map((o) => {
    const [, , membershipCode] = o.role.split(ROLE_ASSO_SEPARATOR);
    return `${o.association_id}-${membershipCode}`;
  });
  const fileMemberships = document.memberships.map((o) => `${o.association_id}-${o.code}`);
  return fileMemberships.some((o) => userMemberships.includes(o));
};

export const batchUserSubscription = async (ctx, userIds) => {
  const { associationId } = ctx;
  const subscriptions = await ctx.db.queryRows(
    sql`select role, subscription_date, subscription_last_update, subscription_next_update, 
               account as user_id, membership as membership_id, association as association_id from users_memberships 
               where account IN (${sql.bindings(userIds)}) and association = ${associationId}`
  );
  const perUsers = R.groupBy((s) => s.user_id, subscriptions);
  // noinspection UnnecessaryLocalVariableJS
  const data = userIds.map((id) => (perUsers[id] ? ship(perUsers[id][0]) : undefined));
  return data;
};

export const createAssociation = async (ctx, input) => {
  const { name, description, email, code } = input;
  const association = await getAssociationByCode(ctx, code);
  if (association) return association;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO associations (id, name, description, email, code, register_at) 
                values (${id}, ${name}, ${description}, ${email}, ${code}, current_timestamp)`
  );
  // Create default membership
  const membership = {
    associationId: id,
    name: 'Supporter',
    description: 'A natural or legal person following the non profit organization activity.',
    code: 'supporter',
    fee: 0,
  };
  const createdMembership = await createMembership(ctx, membership);
  // Assign default to this membership
  await ctx.db.execute(
    sql`INSERT INTO associations_default_memberships (association, membership) 
            VALUES (${id}, ${createdMembership.id})`
  );
  // Assign the admin role for this association
  await grantRoleToUser(ctx, ctx.user.id, id, ADMIN_ROLE_CODE);
  // Assign the default role to every platform users
  const users = await getUsers(ctx);
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    // eslint-disable-next-line no-await-in-loop
    await assignUserMembership(ctx, user, { id, code }, createdMembership);
  }
  // Return the created association
  await createNotification(ctx, {
    association_id: id,
    type: 'create',
    content: 'The <code>organization</code> has been created.',
  });
  return getAssociationById(ctx, id);
};

export const updateAssociation = async (ctx, id, input) => {
  const association = await getAssociationById(ctx, id);
  await ctx.db.execute(
    sql`UPDATE associations SET name = ${input.name}, description = ${input.description}, email = ${input.email},
                        website = ${input.website || ''}, logo_url = ${input.logo_url || ''}, subscription_url = ${
      input.subscription_url || ''
    } WHERE id = ${id}`
  );
  const currentDefault = await getAssociationDefaultMembership(ctx, association);
  if (input.default_membership && currentDefault !== input.default_membership) {
    // Assign new default
    await ctx.db.execute(
      sql`UPDATE associations_default_memberships SET membership = ${input.default_membership} WHERE association = ${id}`
    );
  }
  await createNotification(ctx, {
    association_id: id,
    type: 'update',
    content: 'Basic information about this <code>organization</code> has been modified.',
  });
  return getAssociationById(ctx, id);
};

export const deleteAssociation = async (ctx, id) => {
  const association = await getAssociationById(ctx, id);
  if (!association) {
    throw FunctionalError('Association not found', { id });
  }
  // Delete roles in keycloak
  await kcDeleteAssociationRoles(association);
  // Delete association in db
  await ctx.db.execute(sql`DELETE FROM notifications where association_id = ${id}`);
  await ctx.db.execute(sql`DELETE FROM associations_default_memberships where association = ${id}`);
  await ctx.db.execute(sql`DELETE FROM users_memberships where association = ${id}`);
  await ctx.db.execute(sql`DELETE FROM memberships where association_id = ${id}`);
  await ctx.db.execute(sql`DELETE FROM users_roles where association_id = ${id}`);
  await ctx.db.execute(sql`DELETE FROM associations where id = ${id}`);
  return id;
};
