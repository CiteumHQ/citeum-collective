import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createAssociationRole } from '../database/keycloak';
import { getAssociationById } from './associations';

export const getMembershipById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from memberships where id = ${id}`);
};

export const getMembershipAssociation = (ctx, membership) => {
  return ctx.db.queryOne(sql`select * from associations where id = ${membership.association_id}`);
};

export const getAssociationMemberships = (ctx, association) => {
  return ctx.db.queryRows(sql`select * from memberships where association_id = ${association.id}`);
};

export const getMembershipByCode = (ctx, association, code) => {
  return ctx.db.queryOne(sql`select * from memberships 
                                where association_id = ${association.id} and code = ${code}`);
};

export const createMembership = async (ctx, input) => {
  const { associationId, name, code } = input;
  const association = await getAssociationById(ctx, associationId);
  if (!association) {
    throw Error('Cant find the association to create the membership');
  }
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
