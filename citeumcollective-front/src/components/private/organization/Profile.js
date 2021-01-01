import React, { useContext } from 'react';
import { gql, useMutation } from '@apollo/client';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Formik, Form, Field } from 'formik';
import { TextField, Switch } from 'formik-material-ui';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import DateFnsUtils from '@date-io/date-fns';
import * as Yup from 'yup';
import { UserContext } from '../Context';

const MUTATION_UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UserEditInput!) {
    updateProfile(input: $input) {
      firstName
      lastName
      birthday
      address
      organization
      job_position
      is_organization
    }
  }
`;

const userValidation = () => Yup.object().shape({
  firstName: Yup.string().required('This field is required'),
  lastName: Yup.string().required('This field is required'),
  birthday: Yup.date(),
  address: Yup.string(),
  organization: Yup.string(),
  job_position: Yup.string(),
  is_organization: Yup.boolean(),
});

const Profile = () => {
  const { me, refetch } = useContext(UserContext);
  const [updateProfile] = useMutation(MUTATION_UPDATE_PROFILE, {
    onCompleted() {
      refetch();
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const {
      firstName,
      lastName,
      birthday,
      address,
      organization,
      // eslint-disable-next-line camelcase
      job_position,
      // eslint-disable-next-line camelcase
      is_organization,
    } = values;
    const input = {
      firstName,
      lastName,
      birthday,
      address,
      organization,
      job_position,
      is_organization,
    };
    updateProfile({ variables: { input } }).finally(() => setSubmitting(false));
  };
  return (
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <Formik
          enableReinitialize={true}
          initialValues={me}
          validationSchema={userValidation()}
          onSubmit={formSubmit}
        >
          {({ submitForm, isSubmitting }) => (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="firstName"
                      label="Firstname"
                      fullWidth={true}
                    />
                    <Field
                      component={TextField}
                      name="email"
                      label="Email"
                      disabled={true}
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="lastName"
                      label="Lastname"
                      fullWidth={true}
                    />
                    <Field
                      component={KeyboardDatePicker}
                      name="birthday"
                      label="Birthday"
                      fullWidth={true}
                      autoOk={true}
                      disableFuture={true}
                      format="yyyy-MM-dd"
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                </Grid>
                <Field
                  component={TextField}
                  name="address"
                  label="Address"
                  fullWidth={true}
                  multiline={true}
                  rows={4}
                  style={{ marginTop: 20 }}
                />
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="organization"
                      label="Organization"
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="job_position"
                      label="Job position"
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  control={
                    <Field
                      component={Switch}
                      type="checkbox"
                      name="is_organization"
                    />
                  }
                  label="I'm representing an organization"
                  style={{ marginTop: 20 }}
                />
                <div className="clearfix" />
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  disabled={isSubmitting}
                  onClick={submitForm}
                  style={{ marginTop: 20 }}
                >
                  Save
                </Button>
              </Form>
            </MuiPickersUtilsProvider>
          )}
        </Formik>
      </Grid>
      <Grid item xs={6}></Grid>
    </Grid>
  );
};

export default Profile;
