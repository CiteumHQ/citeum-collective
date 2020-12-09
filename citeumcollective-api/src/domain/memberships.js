import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createAssociationRole } from '../database/keycloak';

export const getMembershipById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from memberships where id = ${id}`);
};

export const getMembershipByCode = (ctx, association, code) => {
  return ctx.db.queryOne(sql`select * from memberships 
                                where association_id = ${association.id} and code = ${code}`);
};

export const createMembership = async (ctx, association, input) => {
  const { name, code } = input;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO memberships (id, name, code, association_id) 
                values (${id}, ${name}, ${code}, ${association.id})`
  );
  // Create the keycloak admin role for this association
  await createAssociationRole(association, code);
  // Return the created membership
  return getMembershipById(ctx, id);
};
