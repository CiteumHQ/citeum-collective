import React from 'react';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle/AlertTitle';

const ErrorNotFound = () => (
  <Alert severity="info">
    <AlertTitle>Error</AlertTitle>
    This page is not found on this Citeum Collective application.
  </Alert>
);

export default ErrorNotFound;
