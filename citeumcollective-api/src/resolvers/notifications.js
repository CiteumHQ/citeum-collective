import { getAssociationNotifications, getNotificationById, getNotifications } from '../domain/notifications';

const notificationsResolvers = {
  Query: {
    notification: (_, { id }, ctx) => getNotificationById(ctx, id),
    notifications: (_, __, ctx) => getNotifications(ctx),
  },
  Association: {
    notifications: (association, _, ctx) => getAssociationNotifications(ctx, association),
  },
};

export default notificationsResolvers;
