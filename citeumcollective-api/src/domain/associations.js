import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createAssociationAdminRole, grantRoleToUser } from '../database/keycloak';

export const getAssociationById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from associations where id = ${id}`);
};

export const getAssociationByCode = (ctx, code) => {
  return ctx.db.queryOne(sql`select * from associations where code = ${code}`);
};

export const createAssociation = async (ctx, input) => {
  const { name, code } = input;
  const association = await getAssociationByCode(ctx, code);
  if (association) return association;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO associations (id, name, code, register_at) 
                values (${id}, ${name}, ${code}, current_timestamp)`
  );
  // Create the keycloak admin role for this association
  const adminRoleName = await createAssociationAdminRole(input);
  await grantRoleToUser(adminRoleName, ctx.user);
  // Return the created association
  return getAssociationById(ctx, id);
};
