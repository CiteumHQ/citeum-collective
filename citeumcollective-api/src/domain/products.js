import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createNotification } from './notifications';
import { kcCreateApplicationClient, kcDeleteClient, kcGetClient } from '../database/keycloak';
import { getAssociationById } from './memberships';

export const getProductById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from products where id = ${id}`);
};

const applicationMemberships = (ctx, id) => {
  return ctx.db.queryRows(sql`
    select m.* from applications d
        left join applications_memberships dm ON d.id = dm.application
        left join memberships m on dm.membership = m.id
        where d.id = ${id} order by m.name asc
  `);
};
export const getApplicationById = async (ctx, id) => {
  const application = await ctx.db.queryOne(sql`select * from applications  where id = ${id}`);
  const memberships = await applicationMemberships(ctx, id);
  return { ...application, memberships };
};

export const getApplicationMemberships = async (ctx, application) => {
  return applicationMemberships(ctx, application.id);
};

export const getAssociationProducts = (ctx, association) => {
  return ctx.db.queryRows(sql`select * from products where association_id = ${association.id} order by name asc`);
};

export const getProductApplications = (ctx, product) => {
  return ctx.db.queryRows(sql`select * from applications where product_id = ${product.id} order by name asc`);
};

export const createProduct = async (ctx, associationId, input) => {
  const { name, description, logo_url: logoUrl } = input;
  // Create the product in the database
  const id = uuidv4();
  await ctx.db.execute(
    sql`insert INTO products (id, name, description, logo_url, association_id, created_at) 
            values (${id}, ${name}, ${description}, ${logoUrl}, ${associationId}, current_timestamp);`
  );
  // Send notification
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_product',
    content: `The product <code>${name}</code> has been created.`,
  });
  return getProductById(ctx, id);
};

export const deleteProduct = async (ctx, productId) => {
  await ctx.db.execute(sql`DELETE FROM products where id = ${productId};`);
  return productId;
};

export const createApplication = async (ctx, productId, input) => {
  const { name, description, url, logo_url: logoUrl, memberships } = input;
  // Create the application in the database
  const id = uuidv4();
  await ctx.db.execute(
    sql`insert INTO applications (id, name, description, url, logo_url, product_id, created_at) 
            values (${id}, ${name}, ${description}, ${url}, ${logoUrl}, ${productId}, current_timestamp);`
  );
  // Associate the document to the correct memberships
  for (let index = 0; index < memberships.length; index += 1) {
    const membership = memberships[index];
    // eslint-disable-next-line no-await-in-loop
    await ctx.db.execute(
      sql`insert INTO applications_memberships (application, membership) values (${id}, ${membership});`
    );
  }
  // Send notification
  const product = await getProductById(ctx, productId);
  await createNotification(ctx, {
    association_id: product.association_id,
    type: 'add_application',
    content: `The application <code>${name}</code> has been created.`,
  });
  return getApplicationById(ctx, id);
};

export const deleteApplication = async (ctx, applicationId) => {
  await ctx.db.execute(sql`DELETE FROM applications where id = ${applicationId};`);
  return applicationId;
};

export const getAssociationClients = (ctx, association) => {
  return ctx.db.queryRows(sql`select keycloak_client_id as id, association as association_id, 
       application as application_id from applications_clients where association = ${association.id}`);
};

export const getApplicationClients = (ctx, application) => {
  return ctx.db.queryRows(sql`select keycloak_client_id as id, association as association_id, 
       application as application_id from applications_clients where application = ${application.id}`);
};

export const createApplicationClient = async (ctx, applicationId) => {
  const application = await getApplicationById(ctx, applicationId);
  const product = await getProductById(ctx, application.product_id);
  const association = await getAssociationById(ctx, product.association_id);
  const clientId = await kcCreateApplicationClient(association, application);
  await ctx.db.execute(
    sql`insert INTO applications_clients (association, application, keycloak_client_id) 
            values (${association.id}, ${application.id}, ${clientId});`
  );
  return kcGetClient({ id: clientId });
};

export const deleteClient = async (ctx, id) => {
  await kcDeleteClient(id);
  await ctx.db.execute(sql`DELETE FROM applications_clients where keycloak_client_id = ${id};`);
  return id;
};
