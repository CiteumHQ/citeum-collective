import React, { useContext } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { withRouter, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Drawer from '@material-ui/core/Drawer';
import { UserContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: 60,
    flexShrink: 0,
  },
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

const LeftBar = ({ location }) => {
  const classes = useStyles();
  const { me, federation } = useContext(UserContext);
  if (me && federation) {
    const federationGravatarUrl = gravatar.url(federation.email, {
      protocol: 'https',
      s: '40',
    });
    return (
      <Drawer
        variant="permanent"
        classes={{ paper: classes.drawerPaper }}
        className={classes.drawer}
      >
        <MenuList component="nav">
          <MenuItem
            component={Link}
            to={`/dashboard/organizations/${federation.id}`}
            selected={location.pathname.includes(
              `/dashboard/organizations/${federation.id}`,
            )}
            dense={false}
            classes={{ root: classes.menuItem }}
          >
            <ListItemIcon>
              <img src={federationGravatarUrl} alt="logo" />
            </ListItemIcon>
          </MenuItem>
          {R.reverse(R.filter((n) => n.id !== federation.id, me.associations)).map(
            (association) => {
              const associationGravatarUrl = gravatar.url(association.email, {
                protocol: 'https',
                s: '40',
              });
              return (
                <MenuItem
                  key={association.id}
                  component={Link}
                  to={`/dashboard/organizations/${association.id}`}
                  selected={location.pathname.includes(
                    `/dashboard/organizations/${association.id}`,
                  )}
                  dense={false}
                  classes={{ root: classes.menuItem }}
                >
                  <ListItemIcon>
                    <img src={associationGravatarUrl} alt="logo" />
                  </ListItemIcon>
                </MenuItem>
              );
            },
          )}
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
