import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import { sql } from '../utils/sql';
import { kcCreateAssociationAdminRole, kcDeleteAssociationRoles, kcGrantRoleToUser } from '../database/keycloak';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from '../database/constants';
import { getAssociationById } from './memberships';
import { FunctionalError } from '../config/errors';
import { createNotification } from './notifications';

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

export const userAssociations = async (ctx, user) => associationsRelatedToUser(ctx, user);

export const userSubscriptions = async (ctx, user) => {
  const subscriptions = await ctx.db.queryRows(
    sql`select role, subscription_date, subscription_last_update, subscription_next_update, account as user_id, membership as membership_id, association as association_id from users_memberships where account = ${user.id}`
  );
  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const subscription of subscriptions) {
    result.push({ id: `${subscription.user_id}_${subscription.membership_id}`, ...subscription });
  }
  return result;
};

export const isDocumentAccessibleFromUser = async (ctx, user, document) => {
  const userOrganisationMemberships = await userSubscriptions({ ...ctx, user }, user);
  const userMemberships = userOrganisationMemberships.map((o) => {
    const [, , membershipCode] = o.role.split(ROLE_ASSO_SEPARATOR);
    return `${o.association.id}-${membershipCode}`;
  });
  const fileMemberships = document.memberships.map((o) => `${o.association_id}-${o.code}`);
  return fileMemberships.some((o) => userMemberships.includes(o));
};

export const userSubscription = async (ctx, user, associationId) => {
  const subscriptions = await userSubscriptions(ctx, user);
  return R.head(R.filter((n) => n.association_id === associationId, subscriptions));
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
  // Create the keycloak admin role for this association
  const adminRoleName = await kcCreateAssociationAdminRole(input);
  await kcGrantRoleToUser(adminRoleName, ctx.user);
  // Return the created association
  await createNotification(ctx, {
    association_id: id,
    type: 'create',
    content: 'The <code>organization</code> has been created.',
  });
  return getAssociationById(ctx, id);
};

export const updateAssociation = async (ctx, id, input) => {
  await ctx.db.execute(
    sql`UPDATE associations SET name = ${input.name}, description = ${input.description}, email = ${
      input.email
    }, website = ${input.website || null} WHERE id = ${id}`
  );
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
  await kcDeleteAssociationRoles(association);
  await ctx.db.execute(sql`DELETE FROM associations where id = ${id}`);
  return id;
};
