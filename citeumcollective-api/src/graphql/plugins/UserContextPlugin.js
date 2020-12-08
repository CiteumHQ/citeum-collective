import { extractUserTokenFromRequest } from '../../config/authentication';
import { getUser } from '../../domain/users';

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      // noinspection UnnecessaryLocalVariableJS
      const extractedUser = await extractUserTokenFromRequest(context.req);
      context.user = await getUser(extractedUser.id);
    },
  }),
};
