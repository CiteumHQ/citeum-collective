import { extractUserTokenFromRequest } from '../../config/authentication';
import { getUserByEmail } from '../../domain/users';
import { logger } from '../../config/conf';

const resolveUser = async (context) => {
  try {
    const token = extractUserTokenFromRequest(context.req);
    if (token) {
      const resolvedUser = await getUserByEmail(context, token.email);
      // const roles = await userRoles(context, token.userId);
      return { ...resolvedUser };
    }
  } catch (e) {
    logger.error('Context error', { reason: e.message });
  }
  // user not found or error occurred when resolving user
  return null;
};

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      context.user = await resolveUser(context);
    },
  }),
};
