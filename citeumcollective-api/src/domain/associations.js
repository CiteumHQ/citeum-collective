import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import { sql } from '../utils/sql';
import { createAssociationAdminRole, grantRoleToUser } from '../database/keycloak';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from '../database/constants';
import conf from '../config/conf';

export const getAssociationById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from associations where id = ${id}`);
};

export const getAssociationByCode = (ctx, code) => {
  return ctx.db.queryOne(sql`select * from associations where code = ${code}`);
};

export const userAssociations = async (ctx) => {
  const userRoles = ctx.user.roles;
  const assoCodes = R.uniq(
    userRoles
      .filter((f) => f.startsWith(ROLE_ASSO_PREFIX))
      .map((a) => {
        const [, association] = a.split(ROLE_ASSO_SEPARATOR);
        return association;
      })
  );
  // TODO Add the way to user to organize the associations.
  const associations = await ctx.db.queryRows(sql`SELECT id, code, name, email from associations 
        where code in (${sql.bindings(assoCodes)})
        order by name`);
  // Remove the default main association
  return associations.filter((a) => a.code !== conf.get('association:identifier'));
};

export const createAssociation = async (ctx, input) => {
  const { name, email, code } = input;
  const association = await getAssociationByCode(ctx, code);
  if (association) return association;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(
    sql`insert INTO associations (id, name, email, code, register_at) 
                values (${id}, ${name}, ${email}, ${code}, current_timestamp)`
  );
  // Create the keycloak admin role for this association
  const adminRoleName = await createAssociationAdminRole(input);
  await grantRoleToUser(adminRoleName, ctx.user);
  // Return the created association
  return getAssociationById(ctx, id);
};
