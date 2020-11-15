import { ApolloServer } from 'apollo-server-express';
import { formatError as apolloFormatError } from 'apollo-errors';
import { GraphQLError } from 'graphql';
import { dissocPath } from 'ramda';
import createSchema from './schema';
import { DEV_MODE } from '../config/conf';
import { UnknownError, ValidationError } from '../config/errors';
import loggerPlugin from './plugins/loggerPlugin';
import SerialMetaPlugin from './plugins/SerialMetaPlugin';
import TransactionPlugin from './plugins/TransactionPlugin';

export const extractTokenFromBearer = (bearer) =>
  bearer && bearer.length > 10 ? bearer.substring('Bearer '.length) : null;
const createApolloServer = (db) => {
  return new ApolloServer({
    schema: createSchema(),
    introspection: true,
    playground: {
      settings: {
        'request.credentials': 'same-origin',
      },
    },
    async context({ req, res, connection }) {
      if (connection) return { user: connection.context.user }; // For websocket connection.
      // let token = req.cookies ? req.cookies[FILIGRAN_TOKEN] : null;
      // token = token || extractTokenFromBearer(req.headers.authorization);
      const auth = null; // await authentication(token);
      if (!auth) return { res, user: auth };
      const origin = {
        source: 'client',
        ip: req.ip,
        user_id: auth.id,
        applicant_id: req.headers['opencti-applicant-id'],
      };
      const authMeta = Object.assign(auth, { origin });
      return { res, user: authMeta };
    },
    tracing: DEV_MODE,
    plugins: [SerialMetaPlugin([TransactionPlugin(db), loggerPlugin])],
    formatError: (error) => {
      let e = apolloFormatError(error);
      if (e instanceof GraphQLError) {
        const errorCode = e.extensions.exception.code;
        if (errorCode === 'ERR_GRAPHQL_CONSTRAINT_VALIDATION') {
          const { fieldName } = e.extensions.exception;
          const ConstraintError = ValidationError(fieldName);
          e = apolloFormatError(ConstraintError);
        } else {
          e = apolloFormatError(UnknownError(errorCode));
        }
      }
      // Remove the exception stack in production.
      return DEV_MODE ? e : dissocPath(['extensions', 'exception'], e);
    },
  });
};

export default createApolloServer;
