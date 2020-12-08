import { version } from '../../package.json';
import { sql } from '../utils/sql';

// eslint-disable-next-line import/prefer-default-export
export const getApplicationInfo = async (ctx) => {
  const query = sql`SHOW server_version`;
  const postgreVersion = await ctx.db.queryOne(query);
  return { app: version, postgre: postgreVersion.server_version };
};
