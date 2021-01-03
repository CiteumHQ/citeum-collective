import React, { useContext } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import * as Yup from 'yup';
import { useBasicQuery } from '../../../../network/Apollo';
import { OrganizationContext } from '../../Context';

export const QUERY_ASSOCIATION = gql`
  query GetAssociation($id: ID!) {
    association(id: $id) {
      id
      name
      description
      email
      website
      code
    }
  }
`;

const MUTATION_UPDATE_ORGANIZATION = gql`
  mutation AssociationUpdate($id: ID!, $input: AssociationEditInput!) {
    associationUpdate(id: $id, input: $input) {
      name
      description
      email
      website
    }
  }
`;

const associationValidation = () => Yup.object().shape({
  name: Yup.string().required('This field is required'),
  email: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  website: Yup.string().nullable(),
});

const Parameters = () => {
  const { organizationId } = useParams();
  const { refetch } = useContext(OrganizationContext);
  const { data } = useBasicQuery(QUERY_ASSOCIATION, {
    id: organizationId,
  });
  const [updateOrganization] = useMutation(MUTATION_UPDATE_ORGANIZATION, {
    onCompleted() {
      refetch();
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const {
      name, email, description, website,
    } = values;
    const input = {
      name,
      email,
      description,
      website,
    };
    updateOrganization({
      variables: { id: organizationId, input },
    }).finally(() => setSubmitting(false));
  };
  if (data && data.association) {
    const { association } = data;
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={association}
          validationSchema={associationValidation()}
          onSubmit={formSubmit}
        >
          {({ submitForm, isSubmitting }) => (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="name"
                      label="Name"
                      fullWidth={true}
                    />
                    <Field
                      component={TextField}
                      name="email"
                      label="Email"
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      component={TextField}
                      name="code"
                      label="Code"
                      disabled={true}
                      fullWidth={true}
                    />
                    <Field
                      component={TextField}
                      name="website"
                      label="Website"
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Grid>
                </Grid>
                <Field
                  component={TextField}
                  name="description"
                  label="Description"
                  fullWidth={true}
                  multiline={true}
                  rows={4}
                  style={{ marginTop: 20 }}
                />
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
      </div>
    );
  }
  return <div />;
};

export default Parameters;
