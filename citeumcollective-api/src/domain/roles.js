import { sql } from '../utils/sql';

export const grantRoleToUser = async (ctx, userId, associationId, roleName) => {
  await ctx.db.execute(
    sql`insert INTO users_roles (user_id, role_name, association_id) values (${userId}, ${roleName}, ${associationId});`
  );
};

const getRoleByName = (ctx, name) => {
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
