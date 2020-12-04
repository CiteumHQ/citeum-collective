export default (db) => ({
  requestDidStart: () => ({
    didResolveOperation: async (requestContext) => {
      const {
        context,
        operation: { operation },
      } = requestContext;
      if (operation === 'mutation') {
        // mutation will execute in a database transaction
        const trx = await db.transaction();
        context.db = trx;
        // put trx in request context to handle automatic transaction commit/rollback in willSendResponse
        Object.assign(requestContext, { trx });
      } else if (operation === 'query') {
        // query is directly executed on the database without transaction so GraphQL can parallelize the database queries
        context.db = db;
      }
    },
    willSendResponse: async ({ response, trx }) => {
      // handle transaction if exist
      if (trx) {
        if (response.errors) {
          await trx.rollback();
        } else {
          await trx.commit();
        }
      }
    },
  }),
});
