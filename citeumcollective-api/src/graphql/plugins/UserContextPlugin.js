import { extractUserFromRequest } from '../../config/authentication';

export default {
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const { context } = requestContext;
      context.user = await extractUserFromRequest(context, context.req);
    },
  }),
};
