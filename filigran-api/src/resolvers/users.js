import { getUserInfo } from '../domain/users';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => getUserInfo(ctx),
  },
};

export default usersResolvers;
