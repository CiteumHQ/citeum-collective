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

const MUTATION_DELETE_ORGANIZATION = gql`
  mutation AssociationDelete($id: ID!) {
    associationDelete(id: $id)
  }
`;

const OrganizationPopover = ({ id, refetchOrganizations }) => {
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
  const { refetch: refetchUserContext } = useContext(UserContext);
  const [deleteOrganization] = useMutation(MUTATION_DELETE_ORGANIZATION, {
    onCompleted() {
      refetchUserContext();
      refetchOrganizations();
      setDeleting(false);
      setOpenDelete(false);
    },
  });
  const submitDelete = () => {
    setDeleting(true);
    deleteOrganization({ variables: { id } });
  };
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
            setOpenDelete(true);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
      <Dialog
        open={openDelete}
        keepMounted={true}
        TransitionComponent={Transition}
        onClose={() => setOpenDelete(false)}
      >
        <DialogContent>
          <DialogContentText>
            Do you want to delete this organization?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDelete(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={submitDelete}
            color="primary"
            disabled={deleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrganizationPopover;
