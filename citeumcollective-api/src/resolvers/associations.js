import { createAssociation, getAssociationById, userAssociations } from '../domain/associations';

const usersResolvers = {
  Query: {
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
    userAssociations: (_, __, ctx) => userAssociations(ctx),
  },
  Mutation: {
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
  },
};

export default usersResolvers;
