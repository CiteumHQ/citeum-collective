import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import * as R from 'ramda';
import { Autocomplete } from 'formik-material-ui-lab';
import Fab from '@material-ui/core/Fab';
import MuiTextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';
import { useBasicQuery } from '../../../../network/Apollo';

const useStyles = makeStyles(() => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 200,
    zIndex: 2000,
  },
}));

const QUERY_APPLICATIONS = gql`
  query GetApplications($associationId: ID!) {
    association(id: $associationId) {
      products {
        name
        applications {
          id
          name
        }
      }
    }
  }
`;

const MUTATION_ADD_CLIENT = gql`
  mutation ClientAdd($applicationId: ID!) {
    clientAdd(applicationId: $applicationId) {
      id
    }
  }
`;

const memberValidation = () => Yup.object().shape({
  applicationId: Yup.object().required('This field is required'),
});

const AddAuthentication = ({ refetchAuthentications }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const { data } = useBasicQuery(QUERY_APPLICATIONS, {
    associationId: organizationId,
  });
  const [addClient] = useMutation(MUTATION_ADD_CLIENT, {
    onCompleted() {
      setOpen(false);
      refetchAuthentications();
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const variables = { applicationId: values.applicationId.id };
    addClient({ variables });
    setSubmitting(false);
  };
  if (data?.association?.products) {
    const applications = R.flatten(data?.association?.products
      .map((p) => p.applications.map((a) => ({ ...a, product: p.name }))));
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
          initialValues={{ applicationId: null }}
          validationSchema={memberValidation()}
          onSubmit={formSubmit}
          onReset={() => setOpen(false)}
        >
          {({
            submitForm, handleReset, isSubmitting, touched, errors,
          }) => (
            <Form>
              <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth={true}
              >
                <DialogTitle>Add a client</DialogTitle>
                <DialogContent>
                  <Field
                    name="applicationId"
                    component={Autocomplete}
                    fullWidth={true}
                    options={applications}
                    getOptionLabel={(option) => `${option.product} - ${option.name}`
                    }
                    getOptionSelected={(option, value) => option === value
                      || option.id === value
                      || option.id === value.id
                    }
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        error={touched.autocomplete && !!errors.autocomplete}
                        helperText={touched.autocomplete && errors.autocomplete}
                        label="Application"
                      />
                    )}
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
  }
  return <div />;
};

export default AddAuthentication;
