const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
  },
};

export default usersResolvers;
