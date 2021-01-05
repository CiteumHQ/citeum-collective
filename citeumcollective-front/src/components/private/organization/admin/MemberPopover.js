import React, { useContext, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import * as R from 'ramda';
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
import * as Yup from 'yup';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { UserContext } from '../../Context';

const useStyles = makeStyles(() => ({
  container: {
    margin: 0,
  },
}));

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
Transition.displayName = 'TransitionSlide';

const MUTATION_UPDATE_MEMBER = gql`
  mutation MemberUpdate($id: ID!, $input: MemberEditInput!) {
    memberUpdate(input: $input) {
      id
      firstName
      lastName
      email
      subscription(associationId: $id) {
        subscription_date
        subscription_last_update
        subscription_next_update
        membership {
          id
          name
          code
          description
          color
        }
      }
    }
  }
`;

const MUTATION_DELETE_MEMBER = gql`
  mutation MemberDelete($associationId: ID!, $userId: ID!, $membershipId: ID!) {
    memberDelete(
      associationId: $associationId
      userId: $userId
      membershipId: $membershipId
    ) {
      id
    }
  }
`;

const memberValidation = () => Yup.object().shape({
  subscription_date: Yup.date().required('This field is required'),
  subscription_last_update: Yup.date().required('This field is required'),
  subscription_next_update: Yup.date().required('This field is required'),
});

const MemberPopover = ({
  associationId,
  userId,
  subscription,
  refetchMembers,
}) => {
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
  const { refetch: refetchUserContext } = useContext(UserContext);
  const [updateMember] = useMutation(MUTATION_UPDATE_MEMBER, {
    onCompleted() {
      refetchUserContext();
      refetchMembers();
      setOpenUpdate(false);
    },
  });
  const [deleteMember] = useMutation(MUTATION_DELETE_MEMBER, {
    onCompleted() {
      refetchUserContext();
      refetchMembers();
      setDeleting(false);
      setOpenDelete(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const input = {
      associationId,
      userId,
      membershipId: subscription.membership.id,
      ...values,
    };
    updateMember({
      variables: { id: associationId, input },
    }).finally(() => setSubmitting(false));
  };
  const submitDelete = () => {
    setDeleting(true);
    deleteMember({
      variables: {
        associationId,
        userId,
        membershipId: subscription.membership.id,
      },
    });
  };
  let initialValues = R.pipe(
    R.pick([
      'subscription_date',
      'subscription_last_update',
      'subscription_next_update',
    ]),
  )(subscription);
  if (!initialValues.subscription_date) {
    initialValues = {
      subscription_date: null,
      subscription_last_update: null,
      subscription_next_update: null,
    };
  }
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
        keepMounted={false}
        TransitionComponent={Transition}
        onClose={() => setOpenUpdate(false)}
      >
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={memberValidation()}
          onSubmit={formSubmit}
        >
          {({ submitForm, isSubmitting }) => (
            <div>
              <DialogContent>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <Form style={{ padding: '10px 0 10px 0' }}>
                    <Field
                      component={KeyboardDatePicker}
                      name="subscription_date"
                      label="Subscription date"
                      fullWidth={true}
                      autoOk={true}
                      disableFuture={true}
                      format="yyyy-MM-dd"
                    />
                    <Field
                      component={KeyboardDatePicker}
                      name="subscription_last_update"
                      label="Subscription last update"
                      fullWidth={true}
                      autoOk={true}
                      disableFuture={true}
                      format="yyyy-MM-dd"
                      style={{ marginTop: 20 }}
                    />
                    <Field
                      component={KeyboardDatePicker}
                      name="subscription_next_update"
                      label="Subscription next update"
                      fullWidth={true}
                      autoOk={true}
                      format="yyyy-MM-dd"
                      style={{ marginTop: 20 }}
                    />
                  </Form>
                </MuiPickersUtilsProvider>
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
            Do you want to remove this member?
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

export default MemberPopover;
