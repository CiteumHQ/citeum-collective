import { updateUser, getUsers } from '../domain/users';
import { userSubscriptions, userAssociations, userSubscription } from '../domain/associations';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
    users: (_, __, ctx) => getUsers(ctx),
  },
  User: {
    associations: (user, __, ctx) => userAssociations(ctx, user),
    subscription: (user, { associationId }, ctx) => userSubscription(ctx, user, associationId),
    subscriptions: (user, __, ctx) => userSubscriptions(ctx, user),
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, ctx.user.id, input),
  },
};

export default usersResolvers;
