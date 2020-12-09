import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { gql } from '@apollo/client';
import { compose } from 'ramda';
import gravatar from 'gravatar';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Drawer from '@material-ui/core/Drawer';
import { useBasicQuery } from '../../../network/Apollo';

const styles = (theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: 80,
  },
  menuList: {
    height: '100%',
  },
  lastItem: {
    bottom: 0,
  },
  logoButton: {
    marginLeft: -23,
    marginRight: 20,
  },
  logo: {
    cursor: 'pointer',
    height: 35,
  },
  toolbar: theme.mixins.toolbar,
  menuItem: {
    height: 40,
    padding: '6px 10px 6px 10px',
  },
  menuItemNested: {
    height: 40,
    padding: '6px 10px 6px 25px',
  },
});

const QUERY_ASSOCIATIONS = gql`
  query GetAssociations {
    federation {
      id
      name
      email
    }
    userAssociations {
      id
      name
      email
    }
  }
`;

const LeftBar = ({ t, location, classes }) => {
  const { data } = useBasicQuery(QUERY_ASSOCIATIONS);
  if (data) {
    const { federation, userAssociations } = data;
    const gravatarUrl = gravatar.url(federation.email, {
      protocol: 'https',
      s: '100',
    });
    return (
      <Drawer variant="permanent" classes={{ paper: classes.drawerPaper }}>
        <MenuList component="nav">
          <MenuItem
            key={federation.id}
            component={Link}
            to={`/private/organizations/${federation.id}`}
            selected={
              location.pathname === `/private/organizations/${federation.id}`
            }
            dense={false}
            classes={{ root: classes.menuItem }}
          >
            <ListItemIcon>
              <img src={gravatarUrl} />
            </ListItemIcon>
            <ListItemText primary={federation.name} />
          </MenuItem>
          {userAssociations.map((association) => (
            <MenuItem
              key={association.id}
              component={Link}
              to={`/private/organizations/${association.id}`}
              selected={
                location.pathname === `/private/organizations/${association.id}`
              }
              dense={false}
              classes={{ root: classes.menuItem }}
            >
              <ListItemIcon style={{ minWidth: 35 }}>fdsf</ListItemIcon>
              <ListItemText primary={t('Dashboard')} />
            </MenuItem>
          ))}
        </MenuList>
      </Drawer>
    );
  }
  return <div />;
};

LeftBar.propTypes = {
  location: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

export default compose(withRouter, withStyles(styles))(LeftBar);
