import { extractUserTokenFromRequest } from '../../config/authentication';
import { getUser } from '../../domain/users';
import { logger } from '../../config/conf';

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      const extractedUser = await extractUserTokenFromRequest(context.req);
      if (extractedUser) {
        try {
          context.user = await getUser(extractedUser.id);
        } catch (e) {
          logger.error('Error extracting user to build context', { error: e });
        }
      }
    },
  }),
};
