/* eslint-disable no-await-in-loop */
import * as gravatar from 'gravatar';
import * as R from 'ramda';
import { sql } from '../utils/sql';
import { ADMIN_ROLE_CODE, kcCreateUser, kcGetUserByName, kcRemoveRoleFromUser, roleGen } from '../database/keycloak';
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

export const listUsers = async (ctx, asso, onlySubscribers) => {
  // Get users of the association
  const usersP = ctx.db.queryRows(sql`select u.* from users u
                                        right join users_memberships um ON u.id = um.account
                                        right join memberships m ON m.id = um.membership
                                        where um.association = ${asso.id}
                                        and m.code != ${onlySubscribers ? 'supporter' : 'all'}`);
  // Get memberships
  const allUserMembershipsP = ctx.db.queryRows(sql` select * from users_memberships where association = ${asso.id}`);
  // Get roles
  const allUserRolesP = ctx.db.queryRows(
    sql`select a.code as association, r.name as role, ur.user_id as account 
                                from users_roles ur
                                right join roles r ON ur.role_name = r.name
                                right join associations a on a.id = ur.association_id
                                where a.id = ${asso.id}`
  );
  const [users, allUserMemberships, allUserRoles] = await Promise.all([usersP, allUserMembershipsP, allUserRolesP]);
  const userMemberships = R.groupBy((g) => g.account, allUserMemberships);
  const reworkedRoles = allUserRoles.map((r) => ({ account: r.account, role: `asso_${r.association}_${r.role}` }));
  const userRoles = R.groupBy((g) => g.account, reworkedRoles);
  // Rebuild the expected result
  // noinspection UnnecessaryLocalVariableJS
  const data = users.map((user) => {
    const gravatarUrl = gravatar.url(user.email, { protocol: 'https', s: '100' });
    const memberships = userMemberships[user.id].map((m) => m.membership);
    const roles = [...userMemberships[user.id].map((m) => m.role), ...(userRoles[user.id] || [])];
    return { ...user, gravatar: gravatarUrl, memberships, roles };
  });
  return data;
};

export const getUser = async (ctx, userId) => {
  const user = await ctx.db.queryOne(sql`select * from users where id = ${userId}`);
  if (!user) return user;
  const userMembershipsPromise = getUserMemberships(ctx, user);
  const userRolesPromise = getUserRoles(ctx, user.id);
  const [userMemberships, userRoles] = await Promise.all([userMembershipsPromise, userRolesPromise]);
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
  // await kcUpdateUserInfo(id, { firstName, lastName });
  const birthday = input.birthday || currentUser.birthday.toString();
  const address = input.address || '';
  const organization = input.organization || '';
  const position = input.job_position || '';
  const isOrganization = input.is_organization || false;
  await ctx.db.execute(
    sql`UPDATE users SET birthday = ${birthday}, address = ${address}, 
                         organization = ${organization}, job_position = ${position}, 
                         is_organization = ${isOrganization},
                         first_name = ${firstName},
                         last_name = ${lastName}
                     WHERE id = ${id}`
  );
  return getUser(ctx, id);
};

export const createUser = async (ctx, user) => {
  const { sub: id, email, given_name: firstName, family_name: lastName } = user;
  await ctx.db.execute(
    sql`insert INTO users (id, first_name, last_name, email, is_organization, register_at) 
               values (${id}, ${firstName}, ${lastName}, ${email}, false, current_timestamp)`
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

export const getAssociationMembers = (ctx, association, onlySubscribers = false) => {
  return listUsers(ctx, association, onlySubscribers);
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
    const databaseUser = await createUser(ctx, { sub: user.id, firstName: 'admin', lastName: 'admin', email });
    const association = await getAssociationByCode(ctx, assoCode);
    await grantRoleToUser(ctx, databaseUser.id, association.id, ADMIN_ROLE_CODE);
  }
};
