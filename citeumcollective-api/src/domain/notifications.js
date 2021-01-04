import { v4 as uuidv4 } from 'uuid';
import { sql } from '../utils/sql';

export const getNotificationById = (ctx, id) => {
  return ctx.db.queryOne(sql`select * from notifications where id = ${id}`);
};

export const getNotifications = (ctx) => {
  return ctx.db.queryRows(sql`select * from notifications order by date desc`);
};

export const getAssociationNotifications = (ctx, association) => {
  return ctx.db.queryRows(
    sql`select * from notifications where association_id = ${association.id} order by date desc limit 10 offset 0`
  );
};

export const getNotificationByContent = (ctx, association, content) => {
  return ctx.db.queryOne(
    sql`select * from notifications where association_id = ${association.id} and content = ${content}`
  );
};

export const createNotification = async (ctx, input) => {
  const { type, content, association_id: associationId } = input;
  const id = uuidv4();
  // Create the association
  await ctx.db.execute(sql`insert INTO notifications (id, date, type, content, association_id) 
                values (${id}, current_timestamp, ${type}, ${content}, ${associationId})`);
  return getNotificationById(ctx, id);
};
