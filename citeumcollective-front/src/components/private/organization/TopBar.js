import React, { useContext, useState } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { Link, withRouter } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {
  PersonOutlined,
  DnsOutlined,
  SettingsOutlined,
  DashboardOutlined,
} from '@material-ui/icons';
import { FileDocumentMultipleOutline, WalletTravel } from 'mdi-material-ui';
import { OrganizationContext, UserContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  appBar: {
    backgroundColor: '#182a31',
    minHeight: 200,
  },
  container: {
    position: 'relative',
    width: '100%',
    padding: '30px 0 20px 0',
    textAlign: 'center',
  },
  title: {
    marginTop: 20,
    flexGrow: 1,
  },
  subtitle: {
    flexGrow: 1,
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
  tab: {
    textTransform: 'none',
  },
}));

const TopBar = ({ location }) => {
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
  const { me, federation } = useContext(UserContext);
  const organizationGravatarUrl = gravatar.url(organization.email, {
    protocol: 'https',
    s: '100',
  });
  const userGravatarUrl = gravatar.url(me.email, {
    protocol: 'https',
    s: '100',
  });
  // eslint-disable-next-line no-useless-escape
  const regex = new RegExp(`/${organization.id}/([a-z]+)`, 'g');
  const match = [...location.pathname.matchAll(regex)];
  let page = 'applications';
  if (match[0]) {
    // eslint-disable-next-line prefer-destructuring
    [, page] = match[0];
  }
  const isAdmin = R.includes(`asso_${organization.code}_admin`, me.roles);
  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <div className={classes.container}>
            <img src={organizationGravatarUrl} alt="logo" />
            <Typography className={classes.title} variant="h2" noWrap>
              {organization.name}
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
        <Tabs
          indicatorColor="secondary"
          textColor="primary"
          variant="fullWidth"
          value={page}
        >
          <Tab
            icon={<DashboardOutlined />}
            value="overview"
            label="Overview"
            component={Link}
            to={`/dashboard/organizations/${organization.id}/overview`}
            className={classes.tab}
          />
          <Tab
            icon={<DnsOutlined />}
            value="applications"
            label="Applications"
            component={Link}
            to={`/dashboard/organizations/${organization.id}/applications`}
            className={classes.tab}
          />
          <Tab
            icon={<FileDocumentMultipleOutline />}
            value="documents"
            label="Documents"
            component={Link}
            to={`/dashboard/organizations/${organization.id}/documents`}
            className={classes.tab}
          />
          <Tab
            icon={<WalletTravel />}
            value="membership"
            label="Membership"
            component={Link}
            to={`/dashboard/organizations/${organization.id}/membership`}
            className={classes.tab}
          />
          {organization.id === federation.id && (
            <Tab
              icon={<PersonOutlined />}
              value="profile"
              label="Profile"
              component={Link}
              to={`/dashboard/organizations/${organization.id}/profile`}
              className={classes.tab}
            />
          )}
          {isAdmin && (
            <Tab
              icon={<SettingsOutlined />}
              value="admin"
              label="Administration"
              component={Link}
              to={`/dashboard/organizations/${organization.id}/admin`}
              className={classes.tab}
            />
          )}
        </Tabs>
      </AppBar>
    </div>
  );
};

TopBar.propTypes = {
  location: PropTypes.object,
};

export default withRouter(TopBar);
