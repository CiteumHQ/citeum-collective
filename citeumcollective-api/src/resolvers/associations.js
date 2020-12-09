import { createAssociation, getAssociationByCode, getAssociationById, userAssociations } from '../domain/associations';
import conf from '../config/conf';

const usersResolvers = {
  Query: {
    association: (_, { id }, ctx) => getAssociationById(ctx, id),
    federation: (_, __, ctx) => getAssociationByCode(ctx, conf.get('association:identifier')),
    userAssociations: (_, __, ctx) => userAssociations(ctx),
  },
  Mutation: {
    associationAdd: (_, { input }, ctx) => createAssociation(ctx, input),
  },
};

export default usersResolvers;
