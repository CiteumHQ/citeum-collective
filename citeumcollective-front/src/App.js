import {
  BrowserRouter, Redirect, Route, Switch,
} from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { client } from './network/Apollo';
import PrivateRoot from './components/private/Root';
import ErrorNotFound from './components/ErrorNotFound';
import AppTheme from './AppTheme';

function App() {
  return (
    <ThemeProvider theme={createMuiTheme(AppTheme)}>
      <BrowserRouter>
        <ApolloProvider client={client}>
          <CssBaseline />
          <Switch>
            <Redirect exact from="/" to={'/dashboard'} />
            <Route path="/dashboard" component={PrivateRoot} />
            <Route path="/" component={ErrorNotFound} />
          </Switch>
        </ApolloProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
