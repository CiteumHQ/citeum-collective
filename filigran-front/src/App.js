import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { client } from './network/Apollo';
import PublicRoot from './components/public/Root';
import PrivateRoot from './components/private/Root';
import AppTheme from './AppTheme';

function App() {
  return (
      <ThemeProvider theme={createMuiTheme(AppTheme)}>
        <BrowserRouter>
            <ApolloProvider client={client}>
                <CssBaseline />
                <Switch>
                    <Route exact path='/' component={PublicRoot} />
                    <Route exact path='/app' component={PrivateRoot} />
                </Switch>
            </ApolloProvider>
        </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
