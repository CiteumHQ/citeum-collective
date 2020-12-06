import { getUser, updateUser } from '../domain/users';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => getUser(ctx),
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, input),
  },
};

export default usersResolvers;
