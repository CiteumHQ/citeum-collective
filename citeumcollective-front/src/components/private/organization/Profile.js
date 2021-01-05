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
import Typography from '@material-ui/core/Typography';
import { UserContext } from '../Context';

const MUTATION_UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UserEditInput!) {
    updateProfile(input: $input) {
      birthday
      address
      organization
      job_position
      is_organization
      organization_logo
      providerInfo {
        firstName
        lastName
      }
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
      // eslint-disable-next-line camelcase
      organization_logo,
    } = values;
    const input = {
      firstName,
      lastName,
      birthday,
      address,
      organization,
      job_position,
      is_organization,
      organization_logo,
    };
    updateProfile({ variables: { input } }).finally(() => setSubmitting(false));
  };
  const initialValues = { ...me, ...me.providerInfo };
  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={8}>
          <Typography variant="h3">Personal information</Typography>
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={userValidation()}
            onSubmit={formSubmit}
          >
            {({ submitForm, isSubmitting, values }) => (
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Form>
                  <Grid container spacing={4}>
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
                  <Grid container spacing={3} style={{ paddingTop: 0 }}>
                    <Grid item xs={6}>
                      <FormControlLabel
                        style={{ marginTop: 20 }}
                        control={
                          <Field
                            component={Switch}
                            type="checkbox"
                            name="is_organization"
                          />
                        }
                        label="I'm representing an organization"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      {values.is_organization && (
                        <Field
                          component={TextField}
                          name="organization_logo"
                          label="Organization logo"
                          fullWidth={true}
                          style={{ marginTop: 20 }}
                        />
                      )}
                    </Grid>
                  </Grid>
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
        <Grid item xs={4} style={{ paddingLeft: 30 }}>
          <Typography variant="h3">Configuration</Typography>
          <Typography variant="body1" style={{ marginTop: 30 }}>
            You can change your email or password even if you are coming from
            another SSO providers.
          </Typography>
          <Button
            style={{ marginTop: 10 }}
            size="small"
            variant="contained"
            component="a"
            href="https://auth.citeum.org/auth/realms/citeum/account/password"
          >
            Update password
          </Button>
          <Typography variant="body1" style={{ marginTop: 30 }}>
            You can enable 2FA using FreeOTP or Google Authenticator.
          </Typography>
          <Button
            style={{ marginTop: 10 }}
            size="small"
            variant="contained"
            component="a"
            href="https://auth.citeum.org/auth/realms/citeum/account/totp"
          >
            Manage 2FA
          </Button>
          <Typography variant="body1" style={{ marginTop: 30 }}>
            You can login with multiple emails or SSO providers on your account.
          </Typography>
          <Button
            style={{ marginTop: 10 }}
            size="small"
            variant="contained"
            component="a"
            href="https://auth.citeum.org/auth/realms/citeum/account/identity"
          >
            Accounts federation
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default Profile;
