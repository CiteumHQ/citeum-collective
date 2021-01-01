import { ApolloClient, InMemoryCache, useQuery } from '@apollo/client';
import { useCallback } from 'react';

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: '/graphql',
});

const errorCodes = {
  UNAUTHENTICATED_CODE: 'AuthRequired',
};

export const getErrorCode = (error) => {
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].name;
  }
  return undefined;
};

export const useBasicQuery = (query, variables, options) => {
  const queryResult = useQuery(query, { ...options, variables });
  if (
    queryResult.error
    && getErrorCode(queryResult.error) === errorCodes.UNAUTHENTICATED_CODE
  ) {
    window.location.href = '/login';
  }
  const optionOnCompleted = options && options.onCompleted;
  const queryResultRefetch = queryResult.refetch;
  const refetch = useCallback(
    async (vars) => {
      const result = await queryResultRefetch(vars);
      optionOnCompleted?.(result.data);
      return result;
    },
    [optionOnCompleted, queryResultRefetch],
  );

  return { ...queryResult, refetch };
};
