import React, { useContext, useEffect, useState } from 'react';
import {
  Route,
  Redirect,
  Switch,
  withRouter,
  useParams,
} from 'react-router-dom';
import { gql } from '@apollo/client';
import { makeStyles } from '@material-ui/core/styles';
import Overview from './Overview';
import Applications from './Applications';
import Profile from './Profile';
import AdminRoot from './admin/Root';
import { UserContext, OrganizationContext } from '../Context';
import { useBasicQuery } from '../../../network/Apollo';
import ErrorNotFound from '../../ErrorNotFound';
import TopBar from './TopBar';

const useStyles = makeStyles(() => ({
  container: {
    width: '100%',
    height: '100%',
    flexGrow: 1,
    padding: '20px 40px 40px 40px',
    minWidth: 0,
  },
}));

const QUERY_ASSOCIATION = gql`
  query GetAssociation($id: ID!) {
    association(id: $id) {
      id
      name
      description
      email
      code
    }
    me {
      subscription(associationId: $id) {
        id
        name
        code
        fee
        description
      }
    }
  }
`;

const Root = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { data, loading, refetch } = useBasicQuery(QUERY_ASSOCIATION, {
    id: organizationId,
  });
  const [contextData, setContextData] = useState();
  const { federation } = useContext(UserContext);
  useEffect(() => {
    if (loading === false && data) {
      setContextData({
        organization: data.association,
        subscription: data.me.subscription,
      });
    }
  }, [loading, data]);
  const organizationData = {
    organization: contextData?.organization,
    subscription: contextData?.subscription,
    refetch,
  };
  return (
    <OrganizationContext.Provider value={organizationData}>
      {organizationData.organization && (
        <div>
          <TopBar />
          <div className={classes.container}>
            <Switch>
              <Route exact path="/dashboard/organizations/:organizationId">
                <Redirect
                  to={`/dashboard/organizations/${organizationId}/overview`}
                />
              </Route>
              <Route
                exact
                path="/dashboard/organizations/:organizationId/overview"
                component={Overview}
              />
              <Route
                exact
                path="/dashboard/organizations/:organizationId/applications"
                component={Applications}
              />
              {organizationId === federation.id && (
                <Route
                  exact
                  path="/dashboard/organizations/:organizationId/profile"
                  component={Profile}
                />
              )}
              <Route
                path="/dashboard/organizations/:organizationId/admin"
                component={AdminRoot}
              />
              <Route path="/dashboard" component={ErrorNotFound} />
            </Switch>
          </div>
        </div>
      )}
    </OrganizationContext.Provider>
  );
};

export default withRouter(Root);
