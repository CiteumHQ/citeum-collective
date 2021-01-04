import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';
import { createNotification } from './notifications';

export const getProductById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from products where id = ${id}`);
};

const applicationMemberships = (ctx, id) => {
  return ctx.db.queryRows(sql`
    select m.* from applications d
        left join applications_memberships dm ON d.id = dm.application
        left join memberships m on dm.membership = m.id
        where d.id = ${id}
  `);
};
export const getApplicationById = async (ctx, id) => {
  const application = await ctx.db.queryOne(sql`select * from applications  where id = ${id}`);
  const memberships = await applicationMemberships(ctx, id);
  return { ...application, memberships };
};

export const getAssociationProducts = (ctx, association) => {
  return ctx.db.queryRows(sql`select * from products where association_id = ${association.id} order by name asc`);
};

export const getProductApplications = (ctx, product) => {
  return ctx.db.queryRows(sql`select * from applications where product_id = ${product.id} order by name asc`);
};

export const createProduct = async (ctx, associationId, input) => {
  const { name, description } = input;
  // Create the product in the database
  const id = uuidv4();
  await ctx.db.execute(
    sql`insert INTO products (id, name, description, association_id, created_at) 
            values (${id}, ${name}, ${description}, ${associationId}, current_timestamp);`
  );
  // Send notification
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_product',
    content: `The product <code>${name}</code> has been created.`,
  });
  return getProductById(ctx, id);
};

export const createApplication = async (ctx, productId, input) => {
  const { name, description, uri, memberships } = input;
  // Create the application in the database
  const id = uuidv4();
  await ctx.db.execute(
    sql`insert INTO applications (id, name, description, uri, product_id, created_at) 
            values (${id}, ${name}, ${description}, ${uri}, ${productId}, current_timestamp);`
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
