import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { gql } from '@apollo/client';
import gravatar from 'gravatar';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Drawer from '@material-ui/core/Drawer';
import { useBasicQuery } from '../../../network/Apollo';

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: 60,
  },
  menuList: {
    height: '100%',
  },
  toolbar: theme.mixins.toolbar,
  menuItem: {
    padding: '6px 8px 6px 8px',
  },
}));

const QUERY_ASSOCIATIONS = gql`
  query GetAssociations {
    federation {
      id
      name
      email
    }
    me {
      associations {
        id
        name
        email
      }
    }
  }
`;

const LeftBar = ({ location }) => {
  const classes = useStyles();
  const { data } = useBasicQuery(QUERY_ASSOCIATIONS);
  if (data) {
    const { federation, me: { associations } } = data;
    const gravatarUrl = gravatar.url(federation.email, {
      protocol: 'https',
      s: '40',
    });
    return (
      <Drawer variant="permanent" classes={{ paper: classes.drawerPaper }}>
        <MenuList component="nav">
          <MenuItem
            key={federation.id}
            component={Link}
            to={`/dashboard/organizations/${federation.id}`}
            selected={
              location.pathname === `/dashboard/organizations/${federation.id}`
            }
            dense={false}
            classes={{ root: classes.menuItem }}
          >
            <ListItemIcon>
              <img src={gravatarUrl} alt="logo" />
            </ListItemIcon>
          </MenuItem>
          {associations.map((association) => {
            const associationGravatarUrl = gravatar.url(association.email, {
              protocol: 'https',
              s: '40',
            });
            return (
              <MenuItem
                key={association.id}
                component={Link}
                to={`/dashboard/organizations/${association.id}`}
                selected={
                  location.pathname
                  === `/dashboard/organizations/${association.id}`
                }
                dense={false}
                classes={{ root: classes.menuItem }}
              >
                <ListItemIcon>
                  <img src={associationGravatarUrl} alt="logo" />
                </ListItemIcon>
              </MenuItem>
            );
          })}
        </MenuList>
      </Drawer>
    );
  }
  return <div />;
};

LeftBar.propTypes = {
  location: PropTypes.object,
};

export default withRouter(LeftBar);
