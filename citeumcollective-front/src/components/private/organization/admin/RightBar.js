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
  Https,
} from '@material-ui/icons';
import { Charity } from 'mdi-material-ui';
import { OrganizationContext, UserContext } from '../../Context';

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: 180,
    flexShrink: 0,
  },
  drawerPaper: {
    paddingTop: 290,
    width: 180,
    zIndex: 500,
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
  const { federation } = useContext(UserContext);
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
          to={`/dashboard/organizations/${organization.id}/admin/memberships`}
          selected={
            location.pathname
            === `/dashboard/organizations/${organization.id}/admin/memberships`
          }
          dense={false}
          classes={{ root: classes.menuItem }}
        >
          <ListItemIcon style={{ minWidth: 50 }}>
            <Charity />
          </ListItemIcon>
          <ListItemText primary="Memberships" />
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/dashboard/organizations/${organization.id}/admin/members`}
          selected={
            location.pathname
            === `/dashboard/organizations/${organization.id}/admin/members`
          }
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
            to={`/dashboard/organizations/${organization.id}/admin/authentications`}
            selected={
              location.pathname
              === `/dashboard/organizations/${organization.id}/admin/authentications`
            }
            dense={false}
            classes={{ root: classes.menuItem }}
        >
          <ListItemIcon style={{ minWidth: 50 }}>
            <Https />
          </ListItemIcon>
          <ListItemText primary="Authentications" />
        </MenuItem>
        {organization.id === federation.id && (
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
        )}
      </MenuList>
    </Drawer>
  );
};

RightBar.propTypes = {
  location: PropTypes.object,
};

export default withRouter(RightBar);
