import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { OrganizationContext, UserContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  appbar: {
    backgroundColor: '#3f535c',
    minHeight: 250,
  },
  container: {
    position: 'relative',
    width: '100%',
    padding: '10px 0 0 0',
    textAlign: 'center',
  },
  title: {
    marginTop: 10,
    flexGrow: 1,
  },
  subtitle: {
    flexGrow: 1,
    padding: 10,
  },
  topAvatar: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  small: {
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
}));

const TopBar = () => {
  const classes = useStyles();
  const [menuOpen, setMenuOpen] = useState({ open: false, anchorEl: null });
  const handleOpenMenu = (event) => {
    event.preventDefault();
    setMenuOpen({ open: true, anchorEl: event.currentTarget });
  };
  const handleCloseMenu = () => {
    setMenuOpen({ open: false, anchorEl: null });
  };
  const { organization } = useContext(OrganizationContext);
  const { me } = useContext(UserContext);
  const organizationGravatarUrl = gravatar.url(organization.email, {
    protocol: 'https',
    s: '150',
  });
  const userGravatarUrl = gravatar.url(me.email, {
    protocol: 'https',
    s: '100',
  });
  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appbar}>
        <Toolbar>
          <div className={classes.container}>
            <img src={organizationGravatarUrl} alt="logo" />
            <Typography className={classes.title} variant="h2" noWrap>
              {organization.name}
            </Typography>
            <Typography className={classes.subtitle} variant="body1" noWrap>
              {organization.description}
            </Typography>
          </div>
          <IconButton onClick={handleOpenMenu} className={classes.topAvatar}>
            <Avatar src={userGravatarUrl} className={classes.small} />
          </IconButton>
          <Menu
            id="menu-appbar"
            style={{ marginTop: 40, zIndex: 2100 }}
            anchorEl={menuOpen.anchorEl}
            open={menuOpen.open}
            onClose={handleCloseMenu}
          >
            <MenuItem
              component={Link}
              to="/dashboard/profile"
              onClick={handleCloseMenu}
            >
              Profile
            </MenuItem>
            <MenuItem component="a" href="/logout" onClick={handleCloseMenu}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default TopBar;
