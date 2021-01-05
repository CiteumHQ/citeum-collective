import React, { useContext, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import { Select } from 'formik-material-ui';
import { Autocomplete } from 'formik-material-ui-lab';
import Fab from '@material-ui/core/Fab';
import MuiTextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';
import { useBasicQuery } from '../../../../network/Apollo';
import { UserContext } from '../../Context';

const useStyles = makeStyles(() => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 200,
    zIndex: 2000,
  },
}));

const QUERY_USERS = gql`
  query GetUsers($associationId: ID!) {
    users {
      id
      email
      providerInfo {
        firstName
        lastName
      }
      subscription(associationId: $associationId) {
        id
        membership {
          name
        }
      }
    }
  }
`;

const QUERY_ASSOCIATION_MEMBERSHIPS = gql`
  query GetAssociationMemberships($id: ID!) {
    association(id: $id) {
      id
      memberships {
        id
        name
      }
    }
  }
`;

const MUTATION_ADD_MEMBER = gql`
  mutation MemberAdd($input: MemberAddInput!) {
    memberAdd(input: $input)
  }
`;

const memberValidation = () => Yup.object().shape({
  userId: Yup.object().required('This field is required'),
  membershipId: Yup.string().required('This field is required'),
});

const AddMember = ({ refetchMembers }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const { refetch: refetchUserContext } = useContext(UserContext);
  const { data: dataUsers } = useBasicQuery(QUERY_USERS, {
    associationId: organizationId,
  });
  const { data: dataMemberships } = useBasicQuery(
    QUERY_ASSOCIATION_MEMBERSHIPS,
    {
      id: organizationId,
    },
  );
  const [addMember] = useMutation(MUTATION_ADD_MEMBER, {
    onCompleted() {
      setOpen(false);
      refetchMembers();
      refetchUserContext();
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const variables = {
      input: {
        associationId: organizationId,
        userId: values.userId.id,
        membershipId: values.membershipId,
      },
    };
    addMember({ variables });
    setSubmitting(false);
  };
  if (
    dataUsers
    && dataUsers.users
    && dataMemberships
    && dataMemberships.association
  ) {
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
            userId: null,
            membershipId: null,
          }}
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
                <DialogTitle>Add a membership</DialogTitle>
                <DialogContent>
                  <Field
                    name="userId"
                    component={Autocomplete}
                    fullWidth={true}
                    options={dataUsers.users}
                    getOptionLabel={(option) => `${option.providerInfo.firstName} ${option.providerInfo.lastName} (${option.email})`
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
                        label="User"
                      />
                    )}
                  />
                  <FormControl fullWidth={true} style={{ marginTop: 20 }}>
                    <InputLabel>Membership</InputLabel>
                    <Field
                      component={Select}
                      name="membershipId"
                      inputProps={{ name: 'membershipId', id: 'membershipId' }}
                    >
                      {dataMemberships.association.memberships.map(
                        (membership) => (
                          <MenuItem key={membership.id} value={membership.id}>
                            {membership.name}
                          </MenuItem>
                        ),
                      )}
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
      </div>
    );
  }
  return <div />;
};

export default AddMember;
