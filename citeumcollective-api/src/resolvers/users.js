import { updateUser } from '../domain/users';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, input),
  },
};

export default usersResolvers;
