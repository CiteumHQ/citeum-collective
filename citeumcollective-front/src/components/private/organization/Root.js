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
import Profile from './Profile';
import Applications from './Applications';
import { UserContext, OrganizationContext } from '../Context';
import { useBasicQuery } from '../../../network/Apollo';
import ErrorNotFound from '../../ErrorNotFound';
import TopBar from './TopBar';

const useStyles = makeStyles(() => ({
  container: {
    width: '100%',
    height: '100%',
    flexGrow: 1,
    padding: 40,
    minWidth: 0,
  },
}));

const QUERY_ASSOCIATION = gql`
  query GetAssociation($id: String!) {
    association(id: $id) {
      id
      name
      description
      email
    }
  }
`;

const Root = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { data, loading } = useBasicQuery(QUERY_ASSOCIATION, {
    id: organizationId,
  });
  const { federation } = useContext(UserContext);
  const [organizationDetail, setOrganizationDetail] = useState();
  useEffect(() => {
    if (loading === false && data) {
      setOrganizationDetail(data.association);
    }
  }, [loading, data]);
  const organizationData = {
    organization: organizationDetail,
  };
  return (
    <OrganizationContext.Provider value={organizationData}>
      {organizationDetail ? (
        <div>
          <TopBar />
          <div className={classes.container}>
            <Switch>
              <Route exact path="/dashboard/organizations/:organizationId">
                {organizationId === federation.id ? (
                  <Redirect
                    to={`/dashboard/organizations/${organizationId}/profile`}
                  />
                ) : (
                  <Redirect
                    to={`/dashboard/organizations/${organizationId}/applications`}
                  />
                )}
              </Route>
              {organizationId === federation.id && (
                <Route
                  exact
                  path="/dashboard/organizations/:organizationId/profile"
                  component={Profile}
                />
              )}
              <Route
                exact
                path="/dashboard/organizations/:organizationId/applications"
                component={Applications}
              />
              <Route
                exact
                path="/dashboard/organizations/:organizationId/administration"
                component={Applications}
              />
              <Route path="/dashboard" component={ErrorNotFound} />
            </Switch>
          </div>
        </div>
      ) : (
        <div />
      )}
    </OrganizationContext.Provider>
  );
};

export default withRouter(Root);
