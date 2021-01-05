/* eslint-disable no-await-in-loop */
import * as gravatar from 'gravatar';
import { sql } from '../utils/sql';
import {
  ADMIN_ROLE_CODE,
  kcCreateUser,
  kcGetUserByName,
  kcRemoveRoleFromUser,
  kcUpdateUserInfo,
  roleGen,
} from '../database/keycloak';
import { FunctionalError } from '../config/errors';
import conf from '../config/conf';
// eslint-disable-next-line import/no-cycle
import { getAssociationByCode, getAssociationDefaultMembership, getAssociations } from './associations';
import { assignUserMembership, getAssociationById, getMembershipById } from './memberships';
import { createNotification, getNotificationByContent } from './notifications';
import { getUserRoles, grantRoleToUser } from './roles';

export const getUserMemberships = (ctx, user) => {
  return ctx.db.queryRows(sql`
    select um.* from memberships m
        right join users_memberships um ON m.id = um.membership
        where um.account = ${user.id}
  `);
};

export const getUser = async (ctx, userId) => {
  const user = await ctx.db.queryOne(sql`select * from users where id = ${userId}`);
  if (!user) return user;
  const userMemberships = await getUserMemberships(ctx, user);
  const userRoles = await getUserRoles(ctx, user.id);
  const memberships = userMemberships.map((m) => m.membership);
  const roles = [...userMemberships.map((m) => m.role), ...userRoles];
  const gravatarUrl = gravatar.url(user.email, { protocol: 'https', s: '100' });
  return { ...user, gravatar: gravatarUrl, memberships, roles };
};

export const isUserExists = async (ctx, email) => {
  const dbUser = await ctx.db.queryOne(sql`select * from users where email = ${email}`);
  return dbUser !== undefined;
};

export const getUserByEmail = async (ctx, email) => {
  const dbUser = await ctx.db.queryOne(sql`select * from users where email = ${email}`);
  return getUser(ctx, dbUser.id);
};

export const getUsers = async (ctx) => {
  return ctx.db.queryRows(sql`select * from users`);
};

export const updateUser = async (ctx, id, input) => {
  const currentUser = await getUser(ctx, id);
  if (!currentUser) {
    throw FunctionalError('Unknown user', { id });
  }
  const { firstName, lastName } = input;
  await kcUpdateUserInfo(id, { firstName, lastName });
  await ctx.db.execute(
    sql`UPDATE users SET birthday = ${input.birthday || currentUser.birthday.toString()}, address = ${
      input.address || ''
    }, organization = ${input.organization || ''}, job_position = ${input.job_position || ''}, is_organization = ${
      input.is_organization || false
    } WHERE id = ${id}`
  );
  return getUser(ctx, id);
};

export const createUser = async (ctx, user) => {
  const { sub: id, email } = user;
  await ctx.db.execute(
    sql`insert INTO users (id, email, is_organization, register_at) values (${id}, ${email}, false, current_timestamp)`
  );
  // We need to assign the created user to all default association membership
  const associations = await getAssociations(ctx);
  for (let index = 0; index < associations.length; index += 1) {
    const association = associations[index];
    const defaultMembership = await getAssociationDefaultMembership(ctx, association);
    const membership = await getMembershipById(ctx, defaultMembership);
    await assignUserMembership(ctx, { id }, association, membership);
  }
  return getUserByEmail(ctx, email);
};

export const getAssociationMembers = async (ctx, association) => {
  const members = [];
  const usersMemberships = await ctx.db.queryRows(
    sql`select * from users_memberships where association = ${association.id}`
  );
  for (let index = 0; index < usersMemberships.length; index += 1) {
    const { account } = usersMemberships[index];
    // eslint-disable-next-line no-await-in-loop
    const user = await getUser(ctx, account);
    members.push(user);
  }
  return members;
};

const extractMemberNeededInfo = async (ctx, userId, associationId, membershipId) => {
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
  return { user, association, membership };
};

export const addMember = async (ctx, input) => {
  const { associationId, userId, membershipId } = input;
  const { association, membership, user } = await extractMemberNeededInfo(ctx, userId, associationId, membershipId);
  await assignUserMembership(ctx, user, association, membership);
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
  return `${user.id}_${membership.id}`;
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
  const { membership, user } = await extractMemberNeededInfo(ctx, userId, associationId, membershipId);
  await ctx.db.execute(
    sql`UPDATE users_memberships SET subscription_date = ${subscriptionDate}, 
                             subscription_last_update = ${subscriptionLastUpdate}, 
                             subscription_next_update= ${subscriptionNextUpdate} 
                where association = ${associationId} and account = ${user.id} and membership = ${membership.id}`
  );
  return user;
};

export const removeMember = async (ctx, associationId, userId, membershipId) => {
  const { association, membership, user } = await extractMemberNeededInfo(ctx, userId, associationId, membershipId);
  await kcRemoveRoleFromUser(roleGen(association, membership.code), user);
  await ctx.db.execute(
    sql`DELETE from users_memberships where association = ${associationId} and account = ${user.id} and membership = ${membership.id}`
  );
  return `${userId}_${membershipId}`;
};

export const initPlatformAdmin = async (ctx) => {
  const email = conf.get('association:admin');
  const assoCode = conf.get('association:identifier');
  // const adminRole = await createAssociationAdminRole({ code: assoCode, name: assoName });
  let user = await kcGetUserByName(email);
  if (user === null) {
    // User doesnt exists
    user = await kcCreateUser(email);
    const databaseUser = await createUser(ctx, { sub: user.id, email });
    const association = await getAssociationByCode(ctx, assoCode);
    await grantRoleToUser(ctx, databaseUser.id, association.id, ADMIN_ROLE_CODE);
  }
};
