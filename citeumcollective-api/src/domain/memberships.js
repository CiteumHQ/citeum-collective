import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import {
  ADMIN_ROLE_CODE,
  kcCreateRoleForAssociation,
  kcDeleteAssociationRole,
  kcGrantRoleToUser,
  roleGen,
} from '../database/keycloak';
import { createNotification } from './notifications';

export const getAssociationById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from associations where id = ${id}`);
};

export const getMembershipById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from memberships where id = ${id}`);
};

export const getMembershipByCode = (ctx, associationId, code) => {
  return ctx.db.queryOne(sql`select * from memberships where code = ${code} and association_id = ${associationId}`);
};

export const getMembershipAssociation = (ctx, membership) => {
  return ctx.db.queryOne(sql`select * from associations where id = ${membership.association_id}`);
};

export const getAssociationMemberships = (ctx, association) => {
  return ctx.db.queryRows(sql`select * from memberships where association_id = ${association.id} order by name asc`);
};

export const updateMembership = async (ctx, id, input) => {
  await ctx.db.execute(
    sql`UPDATE memberships SET name = ${input.name}, description = ${input.description}, fee = ${input.fee}, color = ${
      input.color ? input.color : ''
    } WHERE id = ${id}`
  );
  return getMembershipById(ctx, id);
};

export const deleteMembership = async (ctx, id) => {
  // Remove the role in keycloak
  const membership = await getMembershipById(ctx, id);
  const association = await getMembershipAssociation(ctx, membership);
  await kcDeleteAssociationRole(association, membership);
  // Remove in db
  await ctx.db.execute(sql`delete from documents_memberships where membership = ${id}`);
  await ctx.db.execute(sql`delete from applications_memberships where membership = ${id}`);
  await ctx.db.execute(sql`delete from associations_default_memberships where membership = ${id}`);
  await ctx.db.execute(sql`delete from users_memberships where membership = ${id}`);
  await ctx.db.execute(sql`delete from memberships where id = ${id}`);
  await createNotification(ctx, {
    association_id: association.id,
    type: 'delete_membership',
    content: `The membership <code>${membership.name}</code> has been deleted.`,
  });
  return id;
};

export const createMembership = async (ctx, input) => {
  const { associationId, name, description, code, fee } = input;
  if (code === ADMIN_ROLE_CODE) throw Error('admin is a reserved membership keyword');
  const association = await getAssociationById(ctx, associationId);
  if (!association) {
    throw Error('Cant find the association to create the membership');
  }
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO memberships (id, name, description, code, association_id, fee) 
                values (${id}, ${name}, ${description}, ${code}, ${association.id}, ${fee})`
  );
  // Create the keycloak admin role for this association
  await kcCreateRoleForAssociation(association, code, `${name} role for ${association.name}`);
  // Return the created membership
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_membership',
    content: `The membership <code>${name}</code> has been created.`,
  });
  return getMembershipById(ctx, id);
};

export const assignUserMembership = async (ctx, user, association, membership) => {
  const role = roleGen(association, membership.code);
  // Assign in keycloak
  await kcGrantRoleToUser(role, user);
  // Assign in db
  return ctx.db.execute(
    sql`insert INTO users_memberships (account, membership, association, role, subscription_date, 
                               subscription_last_update, subscription_next_update) 
                values (${user.id}, ${membership.id}, ${association.id}, ${role}, current_timestamp, 
                        current_timestamp, now() + INTERVAL '1 YEAR')`
  );
};
