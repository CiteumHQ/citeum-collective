import { createDocument, deleteDocument, documentMemberships, getAssociationDocuments } from '../domain/documents';

const documentsResolvers = {
  Association: {
    documents: (association, _, ctx) => getAssociationDocuments(ctx, association),
  },
  Document: {
    memberships: (document, _, ctx) => documentMemberships(ctx, document.id),
  },
  Mutation: {
    documentAdd: (_, { organizationId, input, file }, ctx) => createDocument(ctx, organizationId, input, file),
    documentDelete: (_, { id }, ctx) => deleteDocument(ctx, id),
  },
};

export default documentsResolvers;
