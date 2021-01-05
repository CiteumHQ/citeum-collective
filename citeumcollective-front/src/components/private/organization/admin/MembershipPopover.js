import React, { useContext, useState } from 'react';
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
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import * as Yup from 'yup';
import { UserContext } from '../../Context';
import { useBasicQuery } from '../../../../network/Apollo';

const useStyles = makeStyles(() => ({
  container: {
    margin: 0,
  },
}));

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

export const QUERY_MEMBERSHIP = gql`
  query GetMembership($id: ID!) {
    membership(id: $id) {
      id
      code
      name
      description
      fee
      color
    }
  }
`;

const MUTATION_UPDATE_MEMBERSHIP = gql`
  mutation MembershipUpdate($id: ID!, $input: MembershipEditInput!) {
    membershipUpdate(id: $id, input: $input) {
      name
      description
      fee
      color
    }
  }
`;

const MUTATION_DELETE_MEMBERSHIP = gql`
  mutation MembershipDelete($id: ID!) {
    membershipDelete(id: $id)
  }
`;

const membershipValidation = () => Yup.object().shape({
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  fee: Yup.number().required('This field is required'),
  color: Yup.string(),
});

const MembershipPopover = ({ id, refetchMemberships }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateMembership] = useMutation(MUTATION_UPDATE_MEMBERSHIP, {
    onCompleted() {
      refetchMemberships();
      setOpenUpdate(false);
    },
  });
  const [deleteMembership] = useMutation(MUTATION_DELETE_MEMBERSHIP, {
    onCompleted() {
      refetchMemberships();
      setDeleting(false);
      setOpenDelete(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const {
      name, description, fee, color,
    } = values;
    const input = {
      name,
      description,
      fee,
      color,
    };
    updateMembership({
      variables: { id, input },
    }).finally(() => setSubmitting(false));
  };
  const submitDelete = () => {
    setDeleting(true);
    deleteMembership({ variables: { id } });
  };
  const { data } = useBasicQuery(QUERY_MEMBERSHIP, { id });
  if (data && data.membership) {
    return (
      <div className={classes.container}>
        <IconButton
          onClick={(event) => handleClick(event)}
          aria-haspopup="true"
          style={{ marginTop: 1 }}
        >
          <MoreVert />
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
              setOpenUpdate(true);
            }}
          >
            Update
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
        <Dialog
          open={openUpdate}
          keepMounted={true}
          TransitionComponent={Transition}
          onClose={() => setOpenUpdate(false)}
        >
          <Formik
            enableReinitialize={true}
            initialValues={data.membership}
            validationSchema={membershipValidation()}
            onSubmit={formSubmit}
          >
            {({ submitForm, isSubmitting }) => (
              <div>
                <DialogContent>
                  <Form>
                    <Field
                      component={TextField}
                      name="name"
                      label="Name"
                      fullWidth={true}
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
                    <Field
                      component={TextField}
                      name="fee"
                      type="number"
                      label="Fee (€ / year)"
                      style={{ marginTop: 20 }}
                      fullWidth={true}
                    />
                    <Field
                      component={TextField}
                      name="color"
                      label="Color"
                      fullWidth={true}
                      style={{ marginTop: 20 }}
                    />
                  </Form>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setOpenUpdate(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={submitForm}
                    color="secondary"
                  >
                    Update
                  </Button>
                </DialogActions>
              </div>
            )}
          </Formik>
        </Dialog>
        <Dialog
          open={openDelete}
          keepMounted={true}
          TransitionComponent={Transition}
          onClose={() => setOpenDelete(false)}
        >
          <DialogContent>
            <DialogContentText>
              Do you want to delete this membership?
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
  }
  return <div />;
};

export default MembershipPopover;
