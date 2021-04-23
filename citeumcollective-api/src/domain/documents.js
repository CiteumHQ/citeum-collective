import { sql } from '../utils/sql';
import { deleteFile, upload } from '../database/minio';
import { createNotification } from './notifications';

export const createDocumentType = async (ctx, type, icon, description) => {
  await ctx.db.execute(
    sql`insert INTO document_type (id, icon, description) values (${type}, ${icon}, ${description})`
  );
};

export const documentMemberships = async (ctx, id) => {
  return ctx.db.queryRows(sql`
    select m.* from documents d
        left join documents_memberships dm ON d.id = dm.document
        left join memberships m on dm.membership = m.id
        where d.id = ${id} order by m.name
  `);
};
export const loadDocument = async (ctx, id) => {
  const doc = await ctx.db.queryOne(sql`select * from documents where id = ${id}`);
  const memberships = await documentMemberships(ctx, id);
  return { ...doc, memberships };
};

export const createDocument = async (ctx, associationId, input, file) => {
  const { name, description, type, memberships } = input;
  // Upload the file
  const { id, mimetype } = await upload(associationId, file);
  // Create the document in the database
  await ctx.db.execute(
    sql`insert INTO documents (id, association_id, name, description, mimetype, type, created_at) 
            values (${id}, ${associationId}, ${name}, ${description}, ${mimetype}, ${type}, current_timestamp);`
  );
  // Associate the document to the correct memberships
  for (let index = 0; index < memberships.length; index += 1) {
    const membership = memberships[index];
    // eslint-disable-next-line no-await-in-loop
    await ctx.db.execute(sql`insert INTO documents_memberships (document, membership) values (${id}, ${membership});`);
  }
  // Send notification
  await createNotification(ctx, {
    association_id: associationId,
    type: 'add_file',
    content: `The document <code>${name}</code> (${type}) has been uploaded.`,
  });
  return loadDocument(ctx, id);
};

export const deleteDocument = async (ctx, documentId) => {
  // Delete the file in minio
  await deleteFile(documentId);
  // Delete the file in the database
  await ctx.db.execute(sql`DELETE FROM documents_memberships where document = ${documentId};`);
  await ctx.db.execute(sql`DELETE FROM documents where id = ${documentId};`);
  return documentId;
};

export const getAssociationDocuments = async (ctx, association) => {
  const { memberships } = ctx.user;
  return ctx.db.queryRows(
    sql`select d.* from documents d right join documents_memberships dm ON dm.document = d.id
            where d.association_id = ${association.id} and dm.membership IN (${sql.bindings(memberships)})
            order by d.created_at desc`
  );
};
