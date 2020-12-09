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
  const [userDetail, setUserDetail] = useState();
  const [federationDetail, setFederationDetail] = useState();
  const update = (updated) => setUserDetail(updated);
  useEffect(() => {
    if (loading === false && data) {
      setUserDetail(data.me);
      setFederationDetail(data.federation);
    }
  }, [loading, data]);
  const userData = {
    me: userDetail,
    federation: federationDetail,
    isGranted: (assoName, role) => userDetail.roles.includes(`asso_${assoName}_${role}`),
    update,
  };
  return (
    <UserContext.Provider value={userData}>
      <LeftBar />
      <main className={classes.content}>
        {userDetail && (
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
