import React from 'react';

// eslint-disable-next-line import/prefer-default-export
export const UserContext = React.createContext({
  me: null,
  isRoot: () => {},
  isGranted: () => {},
  update: () => {},
});
