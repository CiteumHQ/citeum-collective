import { ApolloServer } from 'apollo-server-express';
import { formatError as apolloFormatError } from 'apollo-errors';
import { GraphQLError } from 'graphql';
import { dissocPath } from 'ramda';
import createSchema from './schema';
import { DEV_MODE } from '../config/conf';
import { UnknownError, ValidationError } from '../config/errors';
import LoggerPlugin from './plugins/LoggerPlugin';
import SerialMetaPlugin from './plugins/SerialMetaPlugin';
import TransactionPlugin from './plugins/TransactionPlugin';
import UserContextPlugin from './plugins/UserContextPlugin';

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
    context: ({ req, res }) => ({
      req,
      res,
    }),
    tracing: DEV_MODE,
    plugins: [SerialMetaPlugin([TransactionPlugin(db), UserContextPlugin, LoggerPlugin])],
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
