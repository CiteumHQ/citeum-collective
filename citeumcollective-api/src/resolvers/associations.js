import { createAssociation, getAssociationById } from '../domain/associations';

const usersResolvers = {
  Query: {
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
  },
  Mutation: {
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
  },
};

export default usersResolvers;
