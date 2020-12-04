import { sql } from '../utils/sql';
import { userInfo } from '../database/keycloak';

export const getUserInfo = async (ctx) => {
  return userInfo(ctx.user.id);
};

export const getUserByEmail = (ctx, email) => {
  return ctx.db.queryOne(sql`select id, email, register_at from users where email = ${email}`);
};

export const createUser = async (ctx, user) => {
  const { id, email } = user;
  await ctx.db.execute(sql`insert INTO users (id, email, register_at) values (${id}, ${email}, current_timestamp)`);
  return getUserByEmail(email);
};
