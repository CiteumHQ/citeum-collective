import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import { sql } from '../utils/sql';
import {
  ADMIN_ROLE_CODE,
  createAssociationAdminRole,
  deleteAssociationRoles,
  grantRoleToUser,
  removeRoleFromUser,
} from '../database/keycloak';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from '../database/constants';
import { getAssociationById, getMembershipByCode, getMembershipById } from './memberships';
import { FunctionalError } from '../config/errors';
import { createNotification, getNotificationByContent } from './notifications';
import { getUser } from './users';

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
  // TODO Add the way to user to organize the associations.
  return ctx.db.queryRows(sql`SELECT id, code, name, description, email from associations 
        where code in (${sql.bindings(assoCodes.map((a) => a.associationCode))})
        order by name`);
};

export const userAssociations = async (ctx, user) => associationsRelatedToUser(ctx, user);

export const userSubscriptions = async (ctx, user) => {
  const associationsTuple = [];
  const associations = await associationsRelatedToUser(ctx, user);
  const roles = user.roles || [];
  for (let index = 0; index < roles.length; index += 1) {
    const role = roles[index];
    const [, associationCode, membershipCode] = role.split(ROLE_ASSO_SEPARATOR);
    const association = R.find((a) => a.code === associationCode, associations);
    if (membershipCode !== ADMIN_ROLE_CODE && association) {
      associationsTuple.push({ association, membershipCode });
    }
  }
  return associationsTuple;
};

export const isDocumentAccessibleFromUser = async (ctx, user, document) => {
  const userOrganisationMemberships = await userSubscriptions({ ...ctx, user });
  const userMemberships = userOrganisationMemberships.map((o) => `${o.association.id}-${o.membershipCode}`);
  const fileMemberships = document.memberships.map((o) => `${o.association_id}-${o.code}`);
  return fileMemberships.some((o) => userMemberships.includes(o));
};

export const userSubscription = async (ctx, user, associationId) => {
  const associations = await userSubscriptions(ctx, user);
  const collective = R.find((a) => a.association.id === associationId, associations);
  if (!collective) return null;
  const membership = await getMembershipByCode(ctx, associationId, collective.membershipCode);
  const userMembership = ctx.db.queryOne(
    sql`select * from users_memberships where association = ${associationId} and account = ${user.id} and membership = ${membership.id}`
  );
  return R.assoc('subscriptionInfo', userMembership, R.assoc('id', `${user.id}_${membership.id}`, membership));
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
  const adminRoleName = await createAssociationAdminRole(input);
  await grantRoleToUser(adminRoleName, ctx.user);
  // Return the created association
  await createNotification(ctx, {
    association_id: id,
    type: 'create',
    content: 'The <code>organization</code> has been created.',
  });
  return getAssociationById(ctx, id);
};

export const addMember = async (ctx, input) => {
  const { associationId, userId, membershipId } = input;
  const association = await getAssociationById(ctx, associationId);
  if (!association) {
    throw FunctionalError('Association not found', { associationId });
  }
  const user = await getUser(ctx, userId);
  if (!user) {
    throw FunctionalError('User not found', { userId });
  }
  const membership = await getMembershipById(ctx, membershipId);
  if (!membership) {
    throw FunctionalError('Membership not found', { membershipId });
  }
  await grantRoleToUser(`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`, user);
  await ctx.db.execute(
    sql`insert INTO users_memberships (account, membership, association, role, subscription_date, subscription_last_update, subscription_next_update) 
                values (${user.id}, ${membership.id}, ${
      association.id
    }, ${`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`}, current_timestamp, current_timestamp, now() + INTERVAL '1 YEAR')`
  );
  // Return the created association
  const content = `<code>${
    user.is_organization ? user.organization : `${user.firstName} ${user.lastName}`
  }</code> is now a <code>${membership.name}</code> member.`;
  const existingNotification = await getNotificationByContent(ctx, association, content);
  if (!existingNotification) {
    await createNotification(ctx, {
      association_id: associationId,
      type: 'add_member',
      content,
    });
  }
  return user;
};

export const updateMember = async (ctx, input) => {
  const {
    associationId,
    userId,
    membershipId,
    subscription_date: subscriptionDate,
    subscription_last_update: subscriptionLastUpdate,
    subscription_next_update: subscriptionNextUpdate,
  } = input;
  const association = await getAssociationById(ctx, associationId);
  if (!association) {
    throw FunctionalError('Association not found', { associationId });
  }
  const user = await getUser(ctx, userId);
  if (!user) {
    throw FunctionalError('User not found', { userId });
  }
  const membership = await getMembershipById(ctx, membershipId);
  if (!membership) {
    throw FunctionalError('Membership not found', { membershipId });
  }
  await ctx.db.execute(
    sql`UPDATE users_memberships SET subscription_date = ${subscriptionDate}, subscription_last_update = ${subscriptionLastUpdate}, subscription_next_update= ${subscriptionNextUpdate} where association = ${associationId} and account = ${user.id} and membership = ${membership.id}`
  );
  return user;
};

export const removeMember = async (ctx, associationId, userId, membershipId) => {
  const association = await getAssociationById(ctx, associationId);
  if (!association) {
    throw FunctionalError('Association not found', { associationId });
  }
  const user = await getUser(ctx, userId);
  if (!user) {
    throw FunctionalError('User not found', { userId });
  }
  const membership = await getMembershipById(ctx, membershipId);
  if (!membership) {
    throw FunctionalError('Membership not found', { membershipId });
  }
  await removeRoleFromUser(`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`, user);
  await ctx.db.execute(
    sql`DELETE from users_memberships where association = ${associationId} and account = ${user.id} and membership = ${membership.id}`
  );
  // Return the created association
  await createNotification(ctx, {
    association_id: associationId,
    type: 'remove_member',
    content: `<code>${
      user.isOrganization ? user.organization : `${user.firstName} ${user.lastName}`
    }</code> is no longer a <code>${membership.name}</code> member.`,
  });
  return user;
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
  await deleteAssociationRoles(association);
  await ctx.db.execute(sql`DELETE FROM associations where id = ${id}`);
  return id;
};
