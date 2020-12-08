import { sql } from '../utils/sql';
import { getUserInfo, updateUserInfo } from '../database/keycloak';

export const getUser = async (ctx) => {
  const userInfo = await getUserInfo(ctx.user.id);
  return Object.assign(ctx.user, userInfo);
};

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
