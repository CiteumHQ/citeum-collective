import React, { useContext } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Drawer from '@material-ui/core/Drawer';
import {
  AssignmentOutlined,
  DomainOutlined,
  GroupOutlined,
} from '@material-ui/icons';
import { OrganizationContext } from '../../Context';

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: 180,
    flexShrink: 0,
  },
  drawerPaper: {
    marginTop: 283,
    width: 180,
  },
  menuList: {
    height: '100%',
  },
  toolbar: theme.mixins.toolbar,
  menuItem: {
    padding: '6px 8px 6px 8px',
  },
}));

const RightBar = ({ location }) => {
  const classes = useStyles();
  const { organization } = useContext(OrganizationContext);
  return (
    <Drawer
      variant="permanent"
      anchor="right"
      classes={{ paper: classes.drawerPaper }}
      className={classes.drawer}
    >
      <MenuList component="nav">
        <MenuItem
          component={Link}
          to={`/dashboard/organizations/${organization.id}/admin/parameters`}
          selected={location.pathname.includes(
            `/dashboard/organizations/${organization.id}/admin/parameters`,
          )}
          dense={false}
          classes={{ root: classes.menuItem }}
        >
          <ListItemIcon style={{ minWidth: 50 }}>
            <AssignmentOutlined />
          </ListItemIcon>
          <ListItemText primary="General" />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/dashboard/organizations/${organization.id}/admin/members`}
          selected={location.pathname.includes(
            `/dashboard/organizations/${organization.id}/admin/members`,
          )}
          dense={false}
          classes={{ root: classes.menuItem }}
        >
          <ListItemIcon style={{ minWidth: 50 }}>
            <GroupOutlined />
          </ListItemIcon>
          <ListItemText primary="Members" />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/dashboard/organizations/${organization.id}/admin/organizations`}
          selected={location.pathname.includes(
            `/dashboard/organizations/${organization.id}/admin/organizations`,
          )}
          dense={false}
          classes={{ root: classes.menuItem }}
        >
          <ListItemIcon style={{ minWidth: 50 }}>
            <DomainOutlined />
          </ListItemIcon>
          <ListItemText primary="Organizations" />
        </MenuItem>
      </MenuList>
    </Drawer>
  );
};

RightBar.propTypes = {
  location: PropTypes.object,
};

export default withRouter(RightBar);
