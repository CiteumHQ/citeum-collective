import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { client } from './network/Apollo';
import Root from './components/Root';

function App() {
  return (
        <BrowserRouter>
            <ApolloProvider client={client}>
                <Root/>
            </ApolloProvider>
        </BrowserRouter>
  );
}

export default App;
