import React from 'react';
import { gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useBasicQuery } from '../../../../network/Apollo';

const QUERY_ASSOCIATION = gql`
  query GetAssociation($id: ID!) {
    association(id: $id) {
      id
      name
      description
      email
      code
    }
  }
`;

const Parameters = () => {
  const { organizationId } = useParams();
  const { data } = useBasicQuery(QUERY_ASSOCIATION, {
    id: organizationId,
  });
  const formSubmit = (values, { setSubmitting }) => {
    setSubmitting(false);
  };
  if (data && data.association) {
    const { association } = data;
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={association}
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
                      disabled={true}
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
