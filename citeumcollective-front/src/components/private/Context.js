import React from 'react';

export const UserContext = React.createContext({
  me: null,
  federation: null,
  isGranted: () => {},
  refetch: () => {},
});

export const OrganizationContext = React.createContext({
  organization: null,
  refetch: () => {},
});
