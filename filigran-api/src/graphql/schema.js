import { GraphQLDateTime } from 'graphql-iso-date';
import { mergeResolvers } from 'merge-graphql-schemas';
import { makeExecutableSchema } from 'graphql-tools';
import { constraintDirective } from 'graphql-constraint-directive';
import settingsResolvers from '../resolvers/settings';
import AuthDirectives, { AUTH_DIRECTIVE } from './authDirective';
import typeDefs from '../../config/schema/filigran.graphql';

const createSchema = () => {
  const globalResolvers = {
    DateTime: GraphQLDateTime,
  };

  const resolvers = mergeResolvers([
    // INTERNAL
    globalResolvers,
    // ENTITIES
    settingsResolvers,
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
