import React, { useContext, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import * as R from "ramda";
import { Field, Form, Formik } from "formik";
import { TextField, Select } from "formik-material-ui";
import {
  Autocomplete,
  AutocompleteRenderInputParams,
} from "formik-material-ui-lab";
import Fab from "@material-ui/core/Fab";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import { Add } from "@material-ui/icons";
import * as Yup from "yup";
import { useParams } from "react-router-dom";
import { UserContext } from "../../Context";
import { useBasicQuery } from "../../../../network/Apollo";

const useStyles = makeStyles(() => ({
  createButton: {
    position: "fixed",
    bottom: 30,
    right: 200,
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

const MUTATION_CREATE_MEMBERSHIP = gql`
  mutation MembershipAdd($input: MembershipAddInput!) {
    membershipAdd(input: $input) {
      id
      name
      code
      fee
      description 
    }
  }
`;

const memberValidation = () =>
  Yup.object().shape({
    code: Yup.string().required("This field is required"),
    name: Yup.string().required("This field is required"),
    description: Yup.string().required("This field is required"),
    fee: Yup.number().required("This field is required"),
  });

const AddMember = ({ refetchMembers }) => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const [open, setOpen] = useState(false);
  const { refetch: refetchUserContext } = useContext(UserContext);
  const { data } = useBasicQuery(QUERY_ASSOCIATION_MEMBERSHIPS, {
    id: organizationId,
  });
  const [createOrganization] = useMutation(MUTATION_CREATE_MEMBERSHIP, {
    onCompleted() {
      refetchUserContext();
      refetchMembers();
      setOpen(false);
    },
  });
  const formSubmit = (values, { setSubmitting }) => {
    createOrganization({
      variables: { input: R.assoc("associationId", organizationId, values) },
    }).finally(() => setSubmitting(false));
  };
  if (data && data.association) {
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
            code: "",
            name: "",
            description: "",
            fee: 0,
          }}
          validationSchema={membershipValidation()}
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
                <DialogTitle>Create a membership</DialogTitle>
                <DialogContent>
                  <Field
                    name="autocomplete"
                    multiple
                    component={Autocomplete}
                    options={users}
                    getOptionLabel={(option: any) => option.title}
                    style={{ width: 300 }}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                      <MuiTextField
                        {...params}
                        error={
                          touched["autocomplete"] && !!errors["autocomplete"]
                        }
                        helperText={
                          touched["autocomplete"] && errors["autocomplete"]
                        }
                        label="Autocomplete"
                        variant="outlined"
                      />
                    )}
                  />
                  <FormControl>
                    <InputLabel shrink={true} htmlFor="tags">
                      Membership
                    </InputLabel>
                    <Field
                      component={Select}
                      type="text"
                      name="tags"
                      multiple={true}
                      inputProps={{ name: "tags", id: "tags" }}
                    >
                      {data.association.memberships.map((membership) => (
                        <MenuItem key={membership.id} value={membership.id}>
                          {membership.name}
                        </MenuItem>
                      ))}
                    </Field>
                  </FormControl>
                  <Field
                    component={TextField}
                    name="name"
                    label="Name"
                    fullWidth={true}
                    style={{ marginTop: 20 }}
                  />
                  <Field
                    component={TextField}
                    name="fee"
                    label="Fee (€ / year)"
                    type="number"
                    fullWidth={true}
                    style={{ marginTop: 20 }}
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
