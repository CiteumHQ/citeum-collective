import React, { useState } from 'react';
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
import { useParams } from 'react-router-dom';
import { useBasicQuery } from '../../../network/Apollo';

const useStyles = makeStyles(() => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 40,
    zIndex: 2000,
  },
}));

const QUERY_ASSOCIATION_MEMBERSHIPS = gql`
  query GetAssociationMemberships($id: ID!) {
    association(id: $id) {
      id
      products {
        id
        name
        description
        logo_url
      }
    }
  }
`;

const MUTATION_CREATE_PRODUCT = gql`
  mutation ProductAdd($associationId: ID!, $input: ProductAddInput!) {
    productAdd(associationId: $associationId, input: $input) {
      id
    }
  }
`;

const productValidation = () => Yup.object().shape({
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  logo_url: Yup.string().required('This field is required'),
});

const ProductCreation = ({ refretchProducts }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const { data: dataMemberships } = useBasicQuery(
    QUERY_ASSOCIATION_MEMBERSHIPS,
    {
      id: organizationId,
    },
  );
  const [createProduct] = useMutation(MUTATION_CREATE_PRODUCT, {
    onCompleted() {
      refretchProducts();
      setOpen(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    // eslint-disable-next-line camelcase
    const { name, description, logo_url } = values;
    const input = {
      name,
      description,
      logo_url,
    };
    const variables = {
      associationId: organizationId,
      input,
    };
    createProduct({ variables }).finally(() => setSubmitting(false));
  };
  if (dataMemberships && dataMemberships.association) {
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
            name: '',
            description: '',
            logo_url: '',
          }}
          validationSchema={productValidation()}
          onSubmit={formSubmit}
          onReset={() => setOpen(false)}
        >
          {({ submitForm, handleReset, isSubmitting }) => (
            <Form>
              <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth={true}
              >
                <DialogTitle>Create a product</DialogTitle>
                <DialogContent>
                  <Field
                    component={TextField}
                    name="name"
                    label="Name"
                    fullWidth={true}
                    multiline={false}
                  />
                  <Field
                    component={TextField}
                    name="logo_url"
                    label="Logo URL"
                    fullWidth={true}
                    multiline={false}
                    style={{ marginTop: 20 }}
                  />
                  <Field
                    component={TextField}
                    name="description"
                    label="Description"
                    fullWidth={true}
                    multiline={false}
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
  }
  return <div />;
};

export default ProductCreation;
