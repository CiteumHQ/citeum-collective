import React from 'react';

export const UserContext = React.createContext({
  me: null,
  federation: null,
  isGranted: () => {},
  update: () => {},
});

export const OrganizationContext = React.createContext({
  organization: null,
  update: () => {},
});
