import { updateUser, getUsers } from '../domain/users';
import { userSubscriptions, userAssociations, batchUserSubscription } from '../domain/associations';
import { batchLoader } from '../utils/sql';

const subscriptionLoader = batchLoader(batchUserSubscription);

const usersResolvers = {
  Query: {
    me: (_, __, ctx) => ctx.user,
    users: (_, __, ctx) => getUsers(ctx),
  },
  User: {
    providerInfo: (user) => ({ firstName: user.first_name, lastName: user.last_name }),
    associations: (user, __, ctx) => userAssociations(ctx, user),
    subscription: (user, { associationId }, ctx) => subscriptionLoader.load({ associationId, ...ctx }, user.id),
    subscriptions: (user, __, ctx) => userSubscriptions(ctx, user),
  },
  UserProtected: {
    providerInfo: (user) => ({ firstName: user.first_name, lastName: user.last_name }),
    subscription: (user, { associationId }, ctx) => subscriptionLoader.load({ associationId, ...ctx }, user.id),
    subscriptions: (user, __, ctx) => userSubscriptions(ctx, user),
  },
  Mutation: {
    updateProfile: (_, { input }, ctx) => updateUser(ctx, ctx.user.id, input),
  },
};

export default usersResolvers;
