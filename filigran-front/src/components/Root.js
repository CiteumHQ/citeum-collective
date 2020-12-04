import { gql } from '@apollo/client';
import React from 'react';
import logo from '../logo.svg';
import './Root.css';
import { useBasicQuery } from '../network/Apollo';

const QUERY_ME = gql`
    query GetMe {
        me {
            email
        }
    }
`;

function Root() {
  const { data } = useBasicQuery(QUERY_ME);
  return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>{data?.me?.email} - <a href='/logout'>Logout</a> </p>
            </header>
        </div>
  );
}

export default Root;
