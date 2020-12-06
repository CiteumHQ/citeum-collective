import { extractUserTokenFromRequest } from '../../config/authentication';

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      // noinspection UnnecessaryLocalVariableJS
      const extractedUser = await extractUserTokenFromRequest(context.req);
      context.user = extractedUser;
    },
  }),
};
