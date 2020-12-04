import { sql } from '../utils/sql';

export const getUserByEmail = (ctx, email) => {
  return ctx.db.queryOne(sql`select email, register_at from users where email = ${email}`);
};

export const createUser = async (ctx, user) => {
  const { email } = user;
  await ctx.db.execute(sql`insert INTO users (email, register_at) values (${email}, current_timestamp)`);
  return getUserByEmail(email);
};
