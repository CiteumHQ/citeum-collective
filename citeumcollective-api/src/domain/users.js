import { sql } from '../utils/sql';
import { getAllUsers, getUserInfo, updateUserInfo } from '../database/keycloak';
import { FunctionalError } from '../config/errors';
import { ROLE_ASSO_PREFIX } from '../database/constants';
import { getAssociationByCode } from './associations';
import { getMembershipByCode } from './memberships';

export const completeUserWithData = async (ctx, user) => {
  const userData = await ctx.db.queryOne(sql`select * from users where id = ${user.id}`);
  return { ...user, ...userData };
};

export const getUser = async (ctx, userId) => {
  const user = await getUserInfo(userId);
  return completeUserWithData(ctx, user);
};

export const getUsers = async () => {
  return getAllUsers();
};

export const updateUser = async (ctx, id, input) => {
  const currentUser = await getUser(ctx, id);
  if (!currentUser) {
    throw FunctionalError('Unknown user', { id });
  }
  const { firstName, lastName } = input;
  const user = await updateUserInfo(id, { firstName, lastName });
  await ctx.db.execute(
    sql`UPDATE users SET birthday = ${input.birthday || currentUser.birthday.toString()}, address = ${
      input.address || ''
    }, organization = ${input.organization || ''}, job_position = ${input.job_position || ''}, is_organization = ${
      input.is_organization || false
    } WHERE id = ${id}`
  );
  return completeUserWithData(ctx, user);
};

export const getUserByEmail = (ctx, email) => {
  return ctx.db.queryOne(sql`select * from users where email = ${email}`);
};

export const createUser = async (ctx, user) => {
  const { sub: id, email } = user;
  await ctx.db.execute(
    sql`insert INTO users (id, email, is_organization, register_at) values (${id}, ${email}, false, current_timestamp)`
  );
  if (user.realm_access && user.realm_access.roles) {
    // eslint-disable-next-line no-restricted-syntax
    for (const role of user.realm_access.roles) {
      if (role.startsWith(ROLE_ASSO_PREFIX)) {
        // eslint-disable-next-line no-await-in-loop
        const splittedRole = role.split('_');
        // eslint-disable-next-line no-await-in-loop
        const association = await getAssociationByCode(ctx, splittedRole[1]);
        // eslint-disable-next-line no-await-in-loop
        const membership = await getMembershipByCode(ctx, association.id, splittedRole[2]);
        // eslint-disable-next-line no-await-in-loop
        await ctx.db.execute(
          sql`insert INTO users_memberships (account, membership, association, role, subscription_date, subscription_last_update, subscription_next_update) 
                values (${id}, ${membership.id}, ${
            association.id
          }, ${`${ROLE_ASSO_PREFIX}${association.code}_${membership.code}`}, current_timestamp, current_timestamp, now() + INTERVAL '1 YEAR')`
        );
      }
    }
  }
  return getUserByEmail(ctx, email);
};
