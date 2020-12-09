import { updateUser } from '../domain/users';
import { userAssociations } from '../domain/associations';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
  },
  User: {
    associations: (_, __, ctx) => userAssociations(ctx),
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, input),
  },
};

export default usersResolvers;
