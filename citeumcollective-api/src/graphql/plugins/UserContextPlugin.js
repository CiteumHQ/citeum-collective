import { extractUserTokenFromRequest } from '../../config/authentication';
import { getUser } from '../../domain/users';

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      const extractedUser = await extractUserTokenFromRequest(context.req);
      context.user = extractedUser && (await getUser(extractedUser.id));
    },
  }),
};
