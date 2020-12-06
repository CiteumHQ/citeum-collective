import CircularProgress from '@material-ui/core/CircularProgress';
import { Route, Switch, withRouter } from 'react-router-dom';
import { gql } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import '../../App.css';
import { makeStyles } from '@material-ui/core/styles';
import { useBasicQuery } from '../../network/Apollo';
import Profile from './home/Profile';
import { UserContext } from './Context';
import Applications from './home/Applications';

const QUERY_ME = gql`
    query GetMe {
        me {
            id
            firstName
            lastName
            email
        }
    }
`;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
}));

const Root = (props) => {
  const classes = useStyles();
  const { data, loading } = useBasicQuery(QUERY_ME);
  const handleChange = (event, value) => props.history.push(value);
  const [userDetail, setUserDetail] = useState();
  const update = (updated) => setUserDetail(updated);
  useEffect(() => {
    if (loading === false && data) {
      setUserDetail(data.me);
    }
  }, [loading, data]);
  return (
        <UserContext.Provider value={{ me: userDetail, update }}>
            <header className="App-header">
                {userDetail
                  ? <div>{userDetail.firstName} {userDetail.lastName} - {userDetail.email} - <a href='/logout'>Logout</a> </div>
                  : <div><CircularProgress /></div>
                }
            </header>
            <div>
                <Paper className={classes.root}>
                    <Tabs
                        value={props.history.location.pathname}
                        onChange={handleChange}
                        indicatorColor="primary"
                        textColor="primary">
                        <Tab label="Profile" value={'/app'} />
                        <Tab label="Applications" value={'/app/applications'} />
                        <Tab label="Documents" value={'/app/documents'} />
                        <Tab label="Membership" value={'/app/memberships'} />
                    </Tabs>
                </Paper>
            </div>
            {userDetail
            && <div>
                <Switch>
                    <Route exact path='/app' component={Profile} />
                    <Route exact path='/app/applications' component={Applications} />
                </Switch>
            </div>}
        </UserContext.Provider>
  );
};

export default withRouter(Root);
