import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import Button from '@material-ui/core/Button';
import * as Yup from 'yup';
import { gql, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import FileUploader from './FileUploader';
import { useBasicQuery } from '../../../network/Apollo';

// region queries
const OrganizationDocuments = gql`
  query Documents($organizationId: ID!) {
    association(id: $organizationId) {
      documents {
        id
        name
        description
      }
    }
  }
`;
const DocumentAddMutation = gql`
  mutation DocumentAdd($organizationId: ID!, $input: DocumentAddInput!, $file: Upload!) {
    documentAdd(organizationId: $organizationId, input: $input, file: $file) {
      id
    }
  }
`;
const DocumentDeleteMutation = gql`
  mutation DocumentDelete($documentId: ID!) {
    documentDelete(id: $documentId)
  }
`;
// endregion

const userValidation = () => Yup.object().shape({
  name: Yup.string().required('This field is required'),
  description: Yup.string().required('This field is required'),
  memberships: Yup.string().required('This field is required'),
});

const Documents = () => {
  const { organizationId } = useParams();
  // Hooks
  const [doc, setDoc] = useState(null);
  const { data, refetch } = useBasicQuery(OrganizationDocuments, { organizationId });
  const [addDoc] = useMutation(DocumentAddMutation, {
    onCompleted() {
      return refetch();
    },
  });
  const [deleteDoc] = useMutation(DocumentDeleteMutation, {
    onCompleted() {
      return refetch();
    },
  });
  // Utils
  const deleteDocument = (documentId) => deleteDoc({ variables: { documentId } });
  const formSubmit = (values, { setSubmitting }) => {
    // memberships: ['ea2d8e48-da04-4a2c-be54-b27fa96336f0', '4f9a4a31-987d-4996-80bc-e1128f51e5eb']
    const { name, description, memberships } = values;
    const input = {
      name, description, memberships: [memberships], type: 'INFORMATION',
    };
    const variables = { organizationId, input, file: doc };
    addDoc({ variables }).finally(() => setSubmitting(false));
  };
  const defaultValues = { name: '', description: '', memberships: '' };
  return <div>
    <div>APP Documents</div>
    <Grid container spacing={3}>
      <Grid item xs={6}>
        {/* eslint-disable-next-line max-len */}
        <Formik enableReinitialize={true} initialValues={defaultValues} validationSchema={userValidation()} onSubmit={formSubmit}>
          {({ submitForm, isSubmitting }) => (
            <Form>
              <Field component={TextField} name="name" label="Name" fullWidth={true} multiline={false}/>
              <Field component={TextField} name="description" label="Description" fullWidth={true} multiline={false}/>
              <Field component={TextField} name="memberships" label="Memberships" fullWidth={true} multiline={false}/>
              <FileUploader onFileSelection={(file) => setDoc(file)} />
              <div className="clearfix" />
              <Button size="small" variant="contained"
                  color="secondary"
                  disabled={isSubmitting}
                  onClick={submitForm}
                  style={{ marginTop: 20 }}>
                Save
              </Button>
            </Form>
          )}
        </Formik>
      </Grid>
    </Grid>
    <br/>
    <hr/>
    <br/>
    <div>Documents</div>
    <ul>
      {(data?.association?.documents || [])
        .map((document) => <li key={document.id}>
          {document.name} - <a href={`/storage/get/${document.id}`}>{document.id}</a>
          <Button size="small" variant="contained" color="secondary" onClick={() => deleteDocument(document.id)}>X</Button>
        </li>)}
    </ul>
  </div>;
};

export default Documents;
