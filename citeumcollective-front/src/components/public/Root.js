import React from 'react';
import * as PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';
import logo from '../../resources/images/logo_text_h.png';
import logoLuatix from '../../resources/images/logo_luatix_text.png';
import logoLimeo from '../../resources/images/logo_limeo_text.png';
import initiativeWhite from '../../resources/images/initiative_white.png';

const styles = () => ({
  container: {
    textAlign: 'center',
    margin: '0 auto',
    paddingTop: 50,
  },
  logo: {
    width: 400,
    margin: '0px 0px 30px 0px',
  },
  item: {
    margin: '0 50px 0 50px',
    display: 'inline-block',
  },
  logosContainer: {
    margin: '100px 0 30px 0',
  },
  footer: {
    textAlign: 'center',
  },
  itemLogo: {
    width: 150,
  },
});

const Root = ({ classes }) => (
  <div className={classes.container}>
    <img src={logo} className={classes.logo} alt="logo" />
    <Typography variant="h5">
      Welcome Citeum Federation&apos;s workspace.
    </Typography>
    <Button
      variant="contained"
      color="secondary"
      style={{ marginTop: 40 }}
      component={Link}
      to="/dashboard"
    >
      Access to the dashboard
    </Button>
    <div className={classes.logosContainer}>
      <div className={classes.item}>
        <img src={logoLuatix} alt="logo_luatix" className={classes.itemLogo} />
      </div>
      <div className={classes.item}>
        <img src={logoLimeo} alt="logo_limeo" className={classes.itemLogo} />
      </div>
    </div>
    <div className={classes.footer}>
      <hr
        style={{
          border: 0,
          height: 1,
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0))',
        }}
      />
      <img
        src={initiativeWhite}
        alt="initiative"
        className={classes.itemLogo}
      />
    </div>
  </div>
);

Root.propTypes = {
  classes: PropTypes.object,
};

export default withStyles(styles)(Root);
