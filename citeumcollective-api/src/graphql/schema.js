import { GraphQLDateTime } from 'graphql-iso-date';
import { mergeResolvers } from 'merge-graphql-schemas';
import { makeExecutableSchema } from 'graphql-tools';
import { constraintDirective } from 'graphql-constraint-directive';
import usersResolvers from '../resolvers/users';
import settingsResolvers from '../resolvers/settings';
import associationsResolvers from '../resolvers/associations';
import notificationsResolvers from '../resolvers/notifications';
import AuthDirectives, { AUTH_DIRECTIVE } from './authDirective';
import typeDefs from '../../config/schema/citeumcollective.graphql';
import documentsResolvers from '../resolvers/documents';

const createSchema = () => {
  const globalResolvers = {
    DateTime: GraphQLDateTime,
  };

  const resolvers = mergeResolvers([
    globalResolvers,
    usersResolvers,
    documentsResolvers,
    settingsResolvers,
    associationsResolvers,
    notificationsResolvers,
  ]);

  return makeExecutableSchema({
    typeDefs,
    resolvers,
    schemaDirectives: {
      [AUTH_DIRECTIVE]: AuthDirectives,
    },
    schemaTransforms: [constraintDirective()],
    inheritResolversFromInterfaces: true,
  });
};

export default createSchema;
