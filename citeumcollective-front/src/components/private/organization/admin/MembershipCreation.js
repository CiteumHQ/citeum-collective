import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import * as R from 'ramda';
import { Field, Form, Formik } from 'formik';
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
import { useParams } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 200,
    zIndex: 2000,
  },
}));

const MUTATION_CREATE_MEMBERSHIP = gql`
  mutation MembershipAdd($input: MembershipAddInput!) {
    membershipAdd(input: $input) {
      id
      name
      code
      fee
      description
    }
  }
`;

const membershipValidation = () => Yup.object().shape({
  code: Yup.string().required('This field is required'),
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  fee: Yup.number().required('This field is required'),
});

const MembershipCreation = ({ refetchMemberships }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const [createOrganization] = useMutation(MUTATION_CREATE_MEMBERSHIP, {
    onCompleted() {
      refetchMemberships();
      setOpen(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    createOrganization({
      variables: { input: R.assoc('associationId', organizationId, values) },
    });
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
          description: '',
          fee: 0,
        }}
        validationSchema={membershipValidation()}
        onSubmit={formSubmit}
        onReset={() => setOpen(false)}
      >
        {({ submitForm, handleReset, isSubmitting }) => (
          <Form>
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth={true}>
              <DialogTitle>Create a membership</DialogTitle>
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
                  name="fee"
                  label="Fee (€ / year)"
                  type="number"
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

export default MembershipCreation;
