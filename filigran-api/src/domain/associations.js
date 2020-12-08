import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createAssociationAdminRole, grantRoleToUser } from '../database/keycloak';

export const getAssociation = (ctx, id) => {
  return ctx.db.queryOne(sql`select id, name, register_at from associations where id = ${id}`);
};

export const createAssociation = async (ctx, input) => {
  const { name } = input;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO associations (id, name, register_at) values (${id}, ${name}, current_timestamp)`
  );
  // Create the keycloak admin role for this association
  const adminRoleName = await createAssociationAdminRole(input);
  await grantRoleToUser(adminRoleName, ctx.user);
  // Return the created association
  return getAssociation(ctx, id);
};
