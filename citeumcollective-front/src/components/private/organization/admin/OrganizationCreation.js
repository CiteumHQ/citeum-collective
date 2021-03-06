import React, { useContext, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';
import Fab from '@material-ui/core/Fab';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import * as Yup from 'yup';
import { UserContext } from '../../Context';

const useStyles = makeStyles(() => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 200,
    zIndex: 2000,
  },
}));

const MUTATION_CREATE_ORGANIZATION = gql`
  mutation AssociationAdd($input: AssociationAddInput!) {
    associationAdd(input: $input) {
      id
      code
      name
      description
      email
    }
  }
`;

const associationValidation = () => Yup.object().shape({
  code: Yup.string().required('This field is required'),
  name: Yup.string().required('This field is required'),
  email: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
});

const OrganizationCreation = ({ refetchOrganizations }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const { refetch: refetchUserContext } = useContext(UserContext);
  const [createOrganization] = useMutation(MUTATION_CREATE_ORGANIZATION, {
    onCompleted() {
      refetchUserContext();
      refetchOrganizations();
      setOpen(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    createOrganization({ variables: { input: values } });
    setSubmitting(false);
  };
  return (
    <div>
      <Fab
        onClick={() => setOpen(true)}
        color="secondary"
        aria-label="Add"
        className={classes.createButton}
      >
        <Add />
      </Fab>
      <Formik
        enableReinitialize={true}
        initialValues={{
          code: '',
          name: '',
          email: '',
          description: '',
        }}
        validationSchema={associationValidation()}
        onSubmit={formSubmit}
        onReset={() => setOpen(false)}
      >
        {({ submitForm, handleReset, isSubmitting }) => (
          <Form>
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth={true}>
              <DialogTitle>Create an organization</DialogTitle>
              <DialogContent>
                <Field
                  component={TextField}
                  name="code"
                  label="Code"
                  fullWidth={true}
                />
                <Field
                  component={TextField}
                  name="name"
                  label="Name"
                  fullWidth={true}
                  style={{ marginTop: 20 }}
                />
                <Field
                  component={TextField}
                  name="email"
                  label="Email"
                  fullWidth={true}
                  style={{ marginTop: 20 }}
                />
                <Field
                  component={TextField}
                  name="description"
                  label="Description"
                  fullWidth={true}
                  multiline={true}
                  rows={4}
                  style={{ marginTop: 20 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleReset} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  onClick={submitForm}
                  disabled={isSubmitting}
                >
                  Create
                </Button>
              </DialogActions>
            </Dialog>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default OrganizationCreation;
