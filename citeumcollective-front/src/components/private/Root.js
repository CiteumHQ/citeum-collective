import {
  Route, Redirect, Switch, withRouter,
} from 'react-router-dom';
import { gql } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useBasicQuery } from '../../network/Apollo';
import { UserContext } from './Context';
import LeftBar from './nav/LeftBar';
import RootOrganization from './organization/Root';
import ErrorNotFound from '../ErrorNotFound';

const useStyles = makeStyles(() => ({
  content: {
    width: '100%',
    height: '100%',
    flexGrow: 1,
    padding: '0 0 0 60px',
    minWidth: 0,
  },
}));

const QUERY_ME = gql`
  query GetMe {
    me {
      id
      firstName
      lastName
      email
      roles
      associations {
        id
        name
        email
      }
    }
    federation {
      id
      name
      email
    }
  }
`;

const Root = () => {
  const classes = useStyles();
  const { data, loading } = useBasicQuery(QUERY_ME);
  const [contextData, setContextData] = useState();
  const update = (updated) => setContextData(updated);
  useEffect(() => {
    if (loading === false && data) {
      setContextData(data);
    }
  }, [loading, data]);
  const userData = {
    me: contextData?.me,
    federation: contextData?.federation,
    isGranted: (assoName, role) => contextData.me.roles.includes(`asso_${assoName}_${role}`),
    update,
  };
  return (
    <UserContext.Provider value={userData}>
      <LeftBar />
      <main className={classes.content}>
        {userData.me && userData.federation && (
          <Switch>
            <Redirect
              exact
              from="/dashboard"
              to={`/dashboard/organizations/${userData.federation.id}`}
            />
            <Redirect
              exact
              from="/dashboard/profile"
              to={`/dashboard/organizations/${userData.federation.id}`}
            />
            <Route
              path="/dashboard/organizations/:organizationId"
              component={RootOrganization}
            />
            <Route path="/dashboard" component={ErrorNotFound} />
          </Switch>
        )}
      </main>
    </UserContext.Provider>
  );
};

export default withRouter(Root);
