import { updateUser } from '../domain/users';
import { userSubscriptions, userAssociations, userSubscription } from '../domain/associations';

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
  },
  User: {
    associations: (_, __, ctx) => userAssociations(ctx),
    subscription: (_, { associationId }, ctx) => userSubscription(ctx, associationId),
    subscriptions: (_, __, ctx) => userSubscriptions(ctx),
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, ctx.user.id, input),
  },
};

export default usersResolvers;
