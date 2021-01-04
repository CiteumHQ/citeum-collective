import React, { useContext } from 'react';
import { parseISO, format } from 'date-fns';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { EventOutlined } from '@material-ui/icons';
import { gql } from '@apollo/client';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import gravatar from 'gravatar';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Chip from '@material-ui/core/Chip';
import * as R from 'ramda';
import { useBasicQuery } from '../../../network/Apollo';
import { OrganizationContext } from '../Context';

const useStyles = makeStyles(() => ({
  paper: {
    padding: 15,
  },
  subscription: {
    borderRadius: 5,
    position: 'absolute',
    right: 0,
    width: 150,
  },
  subscriptionDate: {
    position: 'absolute',
    right: 160,
    cursor: 'default',
  },
  noLink: {
    cursor: 'default',
  },
}));

const QUERY_ASSOCIATION_MEMBERS = gql`
  query GetAssociationMembers($id: ID!) {
    association(id: $id) {
      id
      members {
        id
        firstName
        lastName
        email
        is_organization
        organization
        organization_logo
        subscription(associationId: $id) {
          id
          name
          code
          description
          color
          subscriptionInfo {
            role
            subscription_date
            subscription_last_update
            subscription_next_update
          }
        }
      }
    }
  }
`;

const Membership = () => {
  const classes = useStyles();
  const { organization, subscription } = useContext(OrganizationContext);
  const { data } = useBasicQuery(QUERY_ASSOCIATION_MEMBERS, {
    id: organization.id,
  });
  if (data && data.association) {
    const { association } = data;
    const members = R.pipe(
      R.map((n) => ({
        name: n.is_organization
          ? n.organization
          : `${n.firstName} ${n.lastName}`,
        email: n.email,
        organization_logo: n.organization_logo,
        subscription_date: n.subscription.subscriptionInfo.subscription_date,
        subscription_name: n.subscription.name,
        subscription_color: n.subscription.color,
      })),
      R.uniqBy(R.prop('name')),
      R.sortWith([R.ascend(R.prop('subscription_date'))]),
    )(association.members);
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper variant="outlined" elevation={2} classes={{ root: classes.paper }}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h3">Subscription</Typography>
                <Button
                  className={classes.noLink}
                  style={{
                    border: `1px solid ${subscription.color}`,
                    color: subscription.color,
                  }}
                >
                  {subscription ? subscription.name : 'None'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Date of subscription</Typography>
                <Button color="inherit" className={classes.noLink}>
                  {format(
                    parseISO(subscription.subscriptionInfo.subscription_date),
                    'yyyy-LL-dd',
                  )}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Last renewal</Typography>
                <Button color="inherit" className={classes.noLink}>
                  {format(
                    parseISO(
                      subscription.subscriptionInfo.subscription_last_update,
                    ),
                    'yyyy-LL-dd',
                  )}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Next renewal</Typography>
                <Button color="secondary" className={classes.noLink}>
                  {format(
                    parseISO(
                      subscription.subscriptionInfo.subscription_next_update,
                    ),
                    'yyyy-LL-dd',
                  )}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <List style={{ marginTop: -15 }}>
            {members.map((member) => {
              const memberGravatarUrl = gravatar.url(member.email, {
                protocol: 'https',
                s: '100',
              });
              return (
                <ListItem key={member.id} divider={true}>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        member.organization_logo
                          ? member.organization_logo
                          : memberGravatarUrl
                      }
                      className={classes.small}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={member.name} />
                  <Tooltip
                    title="Subscription date"
                    aria-label="subscriptionDate"
                  >
                    <Button
                      color="primary"
                      className={classes.subscriptionDate}
                      startIcon={<EventOutlined />}
                    >
                      {format(parseISO(member.subscription_date), 'yyyy-LL-dd')}
                    </Button>
                  </Tooltip>
                  <Chip
                    label={member.subscription_name}
                    variant="outlined"
                    className={classes.subscription}
                    style={{
                      border: `1px solid ${member.subscription_color}`,
                      color: member.subscription_color,
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Grid>
      </Grid>
    );
  }
  return <div />;
};

export default Membership;
