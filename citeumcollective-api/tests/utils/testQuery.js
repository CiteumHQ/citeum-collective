import { ApolloServer } from 'apollo-server-express';
import { createTestClient } from 'apollo-server-testing';
import createSchema from '../../src/graphql/schema';

export const ADMIN_USER = {
  id: '88ec0c6a-13ce-5e39-b486-354fe4a7084f',
  name: 'admin',
  email: 'admin@opencti.io',
  origin: { source: 'test', user_id: '88ec0c6a-13ce-5e39-b486-354fe4a7084f' },
};

export const serverFromUser = (user = ADMIN_USER) => {
  return new ApolloServer({
    schema: createSchema(),
    context: () => ({ user }),
  });
};

export const queryAsAdmin = createTestClient(serverFromUser()).query;
export const queryAsUser = (user) => createTestClient(serverFromUser(user)).query;
