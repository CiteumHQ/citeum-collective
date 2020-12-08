import { createAssociation, getAssociation } from '../domain/associations';

const usersResolvers = {
  Query: {
    association: (_, { id }, ctx) => getAssociation(ctx, id),
  },
  Mutation: {
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
  },
};

export default usersResolvers;
