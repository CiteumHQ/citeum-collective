/* eslint-disable no-await-in-loop */
import { sql } from '../utils/sql';
import {
  kcCreateUser,
  kcGetAllUsers,
  kcGetUserByName,
  kcGetUserInfo,
  kcGrantRoleToUser,
  kcRemoveRoleFromUser,
  kcUpdateUserInfo,
} from '../database/keycloak';
import { FunctionalError } from '../config/errors';
import conf from '../config/conf';
import { ROLE_ASSO_PREFIX } from '../database/constants';
import { getAssociationByCode, getAssociations } from './associations';
import { assignUserMembership, getAssociationById, getMembershipByCode, getMembershipById } from './memberships';
import { createNotification, getNotificationByContent } from './notifications';

export const getRoleByName = (ctx, name) => {
  return ctx.db.queryOne(sql`select * from roles where name = ${name}`);
};
export const getUserRoles = (ctx, id) => {
  return ctx.db
    .queryRows(
      sql`select a.code as association, r.name as role from users_roles ur
                                right join roles r ON ur.role_name = r.name
                                right join associations a on a.id = ur.association_id
                                where ur.user_id = ${id}`
    )
    .then((rows) => rows.map((r) => `asso_${r.association}_${r.role}`));
};
export const createRole = async (ctx, name, description) => {
  await ctx.db.execute(sql`insert INTO roles (name, description) values (${name}, ${description});`);
  return getRoleByName(ctx, name);
};
const grantRoleToUser = async (ctx, userId, associationId, roleName) => {
  await ctx.db.execute(
    sql`insert INTO users_roles (user_id, role_name, association_id) values (${userId}, ${roleName}, ${associationId});`
  );
};

export const getUserMemberships = (ctx, user) => {
  return ctx.db.queryRows(sql`
    select um.* from memberships m
        right join users_memberships um ON m.id = um.membership
        where um.account = ${user.id}
  `);
};

const completeUserWithData = async (ctx, user) => {
  const userData = await ctx.db.queryOne(sql`select * from users where id = ${user.id}`);
  const userMemberships = await getUserMemberships(ctx, user);
  const userRoles = await getUserRoles(ctx, user.id);
  const memberships = userMemberships.map((m) => m.membership);
  const roles = [...userMemberships.map((m) => m.role), ...userRoles];
  return { ...user, ...userData, memberships, roles };
};

export const getUser = async (ctx, userId) => {
  const user = await kcGetUserInfo(userId);
  if (!user) {
    return null;
  }
  return completeUserWithData(ctx, user);
};

export const isUserExists = async (ctx, email) => {
  const dbUser = await ctx.db.queryOne(sql`select * from users where email = ${email}`);
  return dbUser !== undefined;
};

export const getUserByEmail = async (ctx, email) => {
  const dbUser = await ctx.db.queryOne(sql`select * from users where email = ${email}`);
  return getUser(ctx, dbUser.id);
};

export const getUsers = async () => {
  return kcGetAllUsers();
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
  // We need to assign the created user to the supporter membership of Citeum
  const associationCode = conf.get('association:identifier');
  const federation = await getAssociationByCode(ctx, associationCode);
  const defaultMembership = await getMembershipByCode(ctx, federation.id, 'supporter');
  await assignUserMembership(ctx, { id }, federation, defaultMembership);
  // When creating a user he can have default role given by the client before existing in Citeum
  // In this case we need to create the right memberships association based on the roles
  if (user.resource_access) {
    const associations = await getAssociations(ctx);
    const existingAssociationCodes = associations.map((a) => a.code);
    for (let index = 0; index < existingAssociationCodes.length; index += 1) {
      const assoCode = existingAssociationCodes[index];
      const eventualAssociation = user.resource_access[assoCode];
      if (eventualAssociation) {
        const { roles } = eventualAssociation;
        for (let i = 0; i < roles.length; i += 1) {
          const role = roles[i];
          const [, associationName, membershipCode] = role.split('_');
          const association = await getAssociationByCode(ctx, associationName);
          const membership = await getMembershipByCode(ctx, association.id, membershipCode);
          await ctx.db.execute(
            sql`insert INTO users_memberships (account, membership, association, role, subscription_date, 
                               subscription_last_update, subscription_next_update)
                values (${id}, ${membership.id}, ${association.id}, 
                        ${`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`}, 
                        current_timestamp, current_timestamp, now() + INTERVAL '1 YEAR')`
          );
        }
      }
    }
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
  await kcGrantRoleToUser(`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`, user);
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
  await kcRemoveRoleFromUser(`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`, user);
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
    await grantRoleToUser(ctx, databaseUser.id, association.id, 'admin');
  }
};
