import React, { useContext, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import { TextField, SimpleFileUpload, Select } from 'formik-material-ui';
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
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import { UserContext } from '../Context';
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
      memberships {
        id
        name
      }
    }
  }
`;

const MUTATION_CREATE_DOCUMENT = gql`
  mutation DocumentAdd(
    $organizationId: ID!
    $input: DocumentAddInput!
    $file: Upload!
  ) {
    documentAdd(organizationId: $organizationId, input: $input, file: $file) {
      id
    }
  }
`;

const documentValidation = () => Yup.object().shape({
  type: Yup.string().required('This field is required'),
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  memberships: Yup.array().required('This field is required'),
});

const DocumentCreation = ({ refetchDocuments }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const { refetch: refetchUserContext } = useContext(UserContext);
  const { data: dataMemberships } = useBasicQuery(
    QUERY_ASSOCIATION_MEMBERSHIPS,
    {
      id: organizationId,
    },
  );
  const [createDocument] = useMutation(MUTATION_CREATE_DOCUMENT, {
    onCompleted() {
      refetchUserContext();
      refetchDocuments();
      setOpen(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    const {
      type, name, description, memberships,
    } = values;
    const input = {
      name,
      description,
      memberships,
      type,
    };
    const variables = {
      organizationId,
      input,
      file: values.file,
    };
    createDocument({ variables }).finally(() => setSubmitting(false));
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
            type: '',
            name: '',
            description: '',
            memberships: [],
            file: {},
          }}
          validationSchema={documentValidation()}
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
                <DialogTitle>Create a file</DialogTitle>
                <DialogContent>
                  <FormControl fullWidth={true}>
                    <InputLabel>Type</InputLabel>
                    <Field
                      component={Select}
                      name="type"
                      inputProps={{ name: 'type', id: 'type' }}
                    >
                      <MenuItem value="INFORMATION">Information</MenuItem>
                      <MenuItem value="MINUTES">Minutes</MenuItem>
                      <MenuItem value="DOCUMENT">Document</MenuItem>
                    </Field>
                  </FormControl>
                  <Field
                    component={TextField}
                    name="name"
                    label="Name"
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
                      {dataMemberships.association.memberships.map(
                        (membership) => (
                          <MenuItem key={membership.id} value={membership.id}>
                            {membership.name}
                          </MenuItem>
                        ),
                      )}
                    </Field>
                  </FormControl>
                  <div style={{ marginTop: 20 }}>
                    <Field
                      component={SimpleFileUpload}
                      name="file"
                      label="File"
                      fullWidth={true}
                      multiline={false}
                    />
                  </div>
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

export default DocumentCreation;
