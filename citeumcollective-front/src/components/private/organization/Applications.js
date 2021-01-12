import React, { useContext } from 'react';
import * as R from 'ramda';
import { gql } from '@apollo/client';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import List from '@material-ui/core/List';
import ProductPopover from './ProductPopover';
import ProductCreation from './ProductCreation';
import { OrganizationContext, UserContext } from '../Context';
import { useBasicQuery } from '../../../network/Apollo';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: 0,
  },
  header: {
    backgroundColor: theme.palette.background.paperDark,
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: 15,
  },
  logo: {
    width: 65,
    float: 'left',
  },
  content: {
    padding: 0,
  },
  membership: {
    marginBottom: 20,
  },
  membershipHeader: {
    height: 30,
  },
}));

const QUERY_ASSOCIATION_PRODUCTS = gql`
  query Documents($organizationId: ID!) {
    association(id: $organizationId) {
      products {
        id
        name
        description
        logo_url
        applications {
          id
          name
          description
          url
          logo_url
          memberships {
            id
            name
            color
          }
        }
      }
      memberships {
        id
        name
        color
      }
    }
  }
`;

const Applications = () => {
  const classes = useStyles();
  const { organization, subscription } = useContext(OrganizationContext);
  const { me } = useContext(UserContext);
  const { data, refetch } = useBasicQuery(QUERY_ASSOCIATION_PRODUCTS, {
    organizationId: organization.id,
  });
  const isAdmin = R.includes(`asso_${organization.code}_admin`, me.roles);
  if (data && data.association) {
    return (
      <div>
        <Grid container spacing={3}>
          {data.association.products.map((product) => (
            <Grid item xs={6} key={product.id}>
              <Paper
                variant="outlined"
                elevation={2}
                classes={{ root: classes.paper }}
              >
                <div className={classes.header}>
                  <img src={product.logo_url} className={classes.logo} />
                  <div style={{ float: 'left', marginLeft: 20 }}>
                    <Typography variant="h1" style={{ letterSpacing: '0.2em' }}>
                      {product.name}
                    </Typography>
                    <Typography
                      variant="h3"
                      style={{ letterSpacing: '0.1em', paddingTop: 10 }}
                    >
                      {product.description}
                    </Typography>
                  </div>
                  <div style={{ float: 'right' }}>
                    {isAdmin && (
                      <ProductPopover
                        id={product.id}
                        memberships={data.association.memberships}
                        refetchProducts={refetch}
                      />
                    )}
                  </div>
                  <div className="clearfix" />
                </div>
                <div className={classes.content}>
                  <List>
                    {product.applications.map((application) => {
                      const membershipIds = R.map(
                        (n) => n.id,
                        application.memberships,
                      );
                      const disabled = !membershipIds.includes(
                        subscription.membership.id,
                      );
                      return (
                        <ListItem
                          key={application.id}
                          disabled={disabled}
                          style={{ color: 'white' }}
                          component="a"
                          href={application.url}
                        >
                          <ListItemAvatar>
                            {disabled ? (
                              <Avatar
                                src={application.logo_url}
                                imgProps={{
                                  style: { filter: 'grayscale(100%)' },
                                }}
                              />
                            ) : (
                              <Avatar src={application.logo_url} />
                            )}
                          </ListItemAvatar>
                          <ListItemText
                            primary={application.name}
                            secondary={application.description}
                          />
                          <div>
                            {application.memberships.map((membership) => (
                              <Chip
                                key={membership.id}
                                label={membership.name
                                  .substring(0, 3)
                                  .toUpperCase()}
                                variant="outlined"
                                style={{
                                  borderColor: membership.color,
                                  color: membership.color,
                                  marginRight: 10,
                                }}
                              />
                            ))}
                          </div>
                        </ListItem>
                      );
                    })}
                  </List>
                </div>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {isAdmin && <ProductCreation refretchProducts={refetch} />}
      </div>
    );
  }
  return <div />;
};

export default Applications;
