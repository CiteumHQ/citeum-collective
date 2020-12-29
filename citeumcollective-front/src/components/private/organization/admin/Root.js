import React, { useContext } from 'react';
import {
  Route,
  Redirect,
  Switch,
  withRouter,
  useParams,
} from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { UserContext } from '../../Context';
import RightBar from './RightBar';
import Parameters from './Parameters';
import Memberships from './Memberships';
import Members from './Members';
import Organizations from './Organizations';

const useStyles = makeStyles(() => ({
  container: {
    width: '100%',
    height: '100%',
    flexGrow: 1,
    paddingRight: 180,
    minWidth: 0,
  },
}));

const Root = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { federation } = useContext(UserContext);
  return (
    <div>
      <RightBar />
      <div className={classes.container}>
        <Switch>
          <Route exact path="/dashboard/organizations/:organizationId/admin">
            <Redirect
              to={`/dashboard/organizations/${organizationId}/admin/parameters`}
            />
          </Route>
          <Route
            exact
            path="/dashboard/organizations/:organizationId/admin/parameters"
            component={Parameters}
          />
          <Route
              exact
              path="/dashboard/organizations/:organizationId/admin/memberships"
              component={Memberships}
          />
          <Route
              exact
              path="/dashboard/organizations/:organizationId/admin/members"
              component={Members}
          />
          {organizationId === federation.id && (
            <Route
              exact
              path="/dashboard/organizations/:organizationId/admin/organizations"
              component={Organizations}
            />
          )}
        </Switch>
      </div>
    </div>
  );
};

export default withRouter(Root);
