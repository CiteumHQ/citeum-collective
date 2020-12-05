import CircularProgress from '@material-ui/core/CircularProgress';
import { Route, Switch } from 'react-router-dom';
import { gql } from '@apollo/client';
import React from 'react';
import logo from '../Logo_text.png';
import '../../App.css';
import { useBasicQuery } from '../../network/Apollo';
import Home from './home/Home';

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

function Root() {
  const { data } = useBasicQuery(QUERY_ME);
  const me = data?.me;
  return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                {me
                  ? <p>{me.firstName} {me.lastName} - {me.email} - <a href='/logout'>Logout</a> </p>
                  : <p><CircularProgress /></p>
                }
            </header>
            {me
            && <div>
                <Switch>
                    <Route exact path='/app' component={Home} />
                </Switch>
            </div>}
        </div>
  );
}

export default Root;
