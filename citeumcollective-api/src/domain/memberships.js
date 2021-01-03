import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import {
  ADMIN_ROLE_CODE,
  createRoleForAssociation,
  deleteAssociationRole,
  getUsersWithRole,
  roleGen,
} from '../database/keycloak';
import { completeUserWithData } from './users';
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

export const getAssociationMembers = async (ctx, association) => {
  const memberships = await getAssociationMemberships(ctx, association);
  const roles = memberships.map((m) => roleGen(association, m.code));
  const members = [];
  for (let index = 0; index < roles.length; index += 1) {
    const role = roles[index];
    // eslint-disable-next-line no-await-in-loop
    const users = await getUsersWithRole(role);
    for (let index2 = 0; index2 < users.length; index2 += 1) {
      const user = users[index2];
      // eslint-disable-next-line no-await-in-loop
      const userCompleted = await completeUserWithData(ctx, user);
      members.push(Object.assign(userCompleted, { roles: [role] }));
    }
  }
  return members;
};

export const updateMembership = async (ctx, id, input) => {
  await ctx.db.execute(
    sql`UPDATE memberships SET name = ${input.name}, description = ${input.description}, fee = ${input.fee} WHERE id = ${id}`
  );
  const membership = await getMembershipById(ctx, id);
  await createNotification(ctx, {
    association_id: membership.association_id,
    type: 'update',
    content: 'Membership information of the <code>organization</code> has been modified.',
  });
  return membership;
};

export const deleteMembership = async (ctx, id) => {
  // Remove the role in keycloak
  const membership = await getMembershipById(ctx, id);
  const association = await getMembershipAssociation(ctx, membership);
  await deleteAssociationRole(association, membership);
  // Remove in db
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
  await createRoleForAssociation(association, code, `${name} role for ${association.name}`);
  // Return the created membership
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_membership',
    content: `The membership <code>${name}</code> has been created.`,
  });
  return getMembershipById(ctx, id);
};
