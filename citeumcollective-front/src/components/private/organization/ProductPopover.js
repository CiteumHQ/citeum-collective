import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import { makeStyles } from '@material-ui/core/styles';
import { MoreVert } from '@material-ui/icons';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Select, TextField } from 'formik-material-ui';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

const useStyles = makeStyles(() => ({
  container: {
    margin: 0,
  },
}));

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

const MUTATION_CREATE_APPLICATION = gql`
  mutation ApplicationAdd($productId: ID!, $input: ApplicationAddInput!) {
    applicationAdd(productId: $productId, input: $input) {
      id
    }
  }
`;

const MUTATION_DELETE_PRODUCT = gql`
  mutation ProductDelete($productId: ID!) {
    productDelete(id: $productId)
  }
`;

const applicationValidation = () => Yup.object().shape({
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  url: Yup.string().required('This field is required'),
  logo_url: Yup.string().required('This field is required'),
});

const ProductPopover = ({ id, memberships, refetchProducts }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteProduct] = useMutation(MUTATION_DELETE_PRODUCT, {
    onCompleted() {
      refetchProducts();
      setDeleting(false);
      setOpenDelete(false);
    },
  });
  const submitDelete = () => {
    setDeleting(true);
    deleteProduct({ variables: { productId: id } });
  };
  const [openCreateApplication, setOpenCreateApplication] = useState(false);
  const [createApplication] = useMutation(MUTATION_CREATE_APPLICATION, {
    onCompleted() {
      refetchProducts();
      setOpenCreateApplication(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const variables = {
      productId: id,
      input: values,
    };
    createApplication({ variables }).finally(() => setSubmitting(false));
  };
  return (
    <div className={classes.container}>
      <IconButton
        onClick={(event) => handleClick(event)}
        aria-haspopup="true"
        style={{ marginTop: 1 }}
      >
        <MoreVert style={{ fontSize: 35 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        style={{ marginTop: 50 }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            setOpenCreateApplication(true);
          }}
        >
          Add application
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            setOpenDelete(true);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
      <Formik
        enableReinitialize={true}
        initialValues={{
          name: '',
          description: '',
          url: '',
          logo_url: '',
          memberships: [],
        }}
        validationSchema={applicationValidation()}
        onSubmit={formSubmit}
        onReset={() => setOpenCreateApplication(false)}
      >
        {({ submitForm, handleReset, isSubmitting }) => (
          <Form>
            <Dialog
              open={openCreateApplication}
              onClose={() => setOpenCreateApplication(false)}
              fullWidth={true}
            >
              <DialogTitle>Create an application</DialogTitle>
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
                  name="url"
                  label="URL"
                  fullWidth={true}
                  multiline={false}
                  style={{ marginTop: 20 }}
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
                <FormControl fullWidth={true} style={{ marginTop: 20 }}>
                  <InputLabel>Membership</InputLabel>
                  <Field
                    component={Select}
                    name="memberships"
                    multiple={true}
                    inputProps={{ name: 'memberships', id: 'memberships' }}
                  >
                    {memberships.map((membership) => (
                      <MenuItem key={membership.id} value={membership.id}>
                        {membership.name}
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>
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
      <Dialog
        open={openDelete}
        keepMounted={true}
        TransitionComponent={Transition}
        onClose={() => setOpenDelete(false)}
      >
        <DialogContent>
          <DialogContentText>
            Do you want to delete this product?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={submitDelete} color="primary" disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductPopover;
