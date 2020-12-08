import { sql } from '../utils/sql';
import { getUserInfo, updateUserInfo } from '../database/keycloak';

export const getUser = async (userId) => getUserInfo(userId);

export const updateUser = async (ctx, input) => {
  return updateUserInfo(ctx.user.id, input);
};

export const getUserByEmail = (ctx, email) => {
  return ctx.db.queryOne(sql`select id, email, register_at from users where email = ${email}`);
};

export const createUser = async (ctx, user) => {
  const { sub: id, email } = user;
  await ctx.db.execute(sql`insert INTO users (id, email, register_at) values (${id}, ${email}, current_timestamp)`);
  return getUserByEmail(ctx, email);
};
