import { sql } from '../utils/sql';
import { upload } from '../database/minio';
import { createNotification } from './notifications';

export const createDocumentType = async (ctx, type, icon, description) => {
  await ctx.db.execute(
    sql`insert INTO document_type (id, icon, description) values (${type}, ${icon}, ${description})`
  );
};

export const createDocument = async (ctx, associationId, input) => {
  const { name, description, type, memberships, file } = input;
  // Upload the file
  const fileName = await upload(associationId, file);
  // Create the document in the database
  await ctx.db.execute(
    sql`insert INTO documents (id, name, description, type, created_at) 
            values (${fileName}, ${name}, ${description}, ${type}, current_timestamp);`
  );
  // Associate the document to the correct memberships
  for (let index = 0; index < memberships.length; index += 1) {
    const membership = memberships[index];
    // eslint-disable-next-line no-await-in-loop
    await ctx.db.execute(sql`insert INTO documents_memberships (document, membership) 
                                values (${fileName}, ${membership});`);
  }
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_file',
    content: `The document <code>${name}</code> (${type}) has been uploaded.`,
  });
};
