import { sql } from '../utils/sql';
import { getAllUsers, getUserInfo, updateUserInfo } from '../database/keycloak';
import { FunctionalError } from '../config/errors';

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
  return getUserByEmail(ctx, email);
};
