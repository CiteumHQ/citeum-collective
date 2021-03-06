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
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Chip from '@material-ui/core/Chip';
import { HandHeartOutline, PuzzleHeartOutline } from 'mdi-material-ui';
import * as R from 'ramda';
import ListItemIcon from '@material-ui/core/ListItemIcon';
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
  subscribe: {
    marginTop: 20,
  },
  fee: {
    width: 80,
  },
}));

const QUERY_ASSOCIATION_MEMBERS = gql`
  query GetAssociationMembers($id: ID!) {
    association(id: $id) {
      id
      subscription_url
      memberships {
        id
        name
        code
        fee
        description
        color
      }
      subscribers {
        id
        gravatar
        is_organization
        organization
        organization_logo
        providerInfo {
          firstName
          lastName
        }
        subscription(associationId: $id) {
          subscription_date
          membership {
            name
            code
            description
            color
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
          : `${n.providerInfo.firstName} ${n.providerInfo.lastName}`,
        gravatar: n.gravatar,
        organization_logo: n.organization_logo,
        subscription_date: n.subscription.subscription_date,
        subscription_name: n.subscription.membership.name,
        subscription_color: n.subscription.membership.color,
      })),
      R.uniqBy(R.prop('name')),
      R.filter((n) => !n.subscription_name.includes('Supporter')),
      R.sortWith([R.ascend(R.prop('subscription_date'))]),
    )(association.subscribers);
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper
            variant="outlined"
            elevation={2}
            classes={{ root: classes.paper }}
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h3">Subscription</Typography>
                <Button
                  className={classes.noLink}
                  style={
                    subscription
                      ? {
                        border: `1px solid ${subscription.membership.color}`,
                        color: subscription.membership.color,
                      }
                      : { color: 'inherit' }
                  }
                >
                  {subscription ? subscription.membership.name : 'None'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Date of subscription</Typography>
                <Button color="inherit" className={classes.noLink}>
                  {subscription
                    ? format(
                      parseISO(subscription.subscription_date),
                      'yyyy-LL-dd',
                    )
                    : 'None'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Last renewal</Typography>
                <Button color="inherit" className={classes.noLink}>
                  {subscription
                    ? format(
                      parseISO(subscription.subscription_last_update),
                      'yyyy-LL-dd',
                    )
                    : 'None'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Next renewal</Typography>
                <Button color="secondary" className={classes.noLink}>
                  {subscription
                    ? format(
                      parseISO(subscription.subscription_next_update),
                      'yyyy-LL-dd',
                    )
                    : 'None'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Typography variant="h3" style={{ marginTop: 30 }}>
            All subscriptions
          </Typography>
          <List style={{ marginTop: -15 }}>
            {association.memberships.map((membership) => (
              <ListItem key={membership.id} divider={true}>
                <ListItemIcon
                  style={{
                    color: membership.color ? membership.color : '#ffffff',
                  }}
                >
                  <PuzzleHeartOutline />
                </ListItemIcon>
                <ListItemText
                  primary={membership.name}
                  secondary={membership.description}
                />
                <Chip
                  label={`${membership.fee}€`}
                  variant="outlined"
                  className={classes.fee}
                  style={{
                    border: `1px solid ${membership.color}`,
                    color: membership.color,
                  }}
                />
              </ListItem>
            ))}
          </List>
          {association.subscription_url && (
            <Button
              variant="outlined"
              color="secondary"
              className={classes.subscribe}
              startIcon={<HandHeartOutline />}
              component="a"
              href={association.subscription_url}
            >
              Upgrade your subscription
            </Button>
          )}
        </Grid>
        <Grid item xs={6}>
          <List style={{ marginTop: -15 }}>
            {members.map((member) => (
                <ListItem key={member.id} divider={true}>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        member.organization_logo
                          ? member.organization_logo
                          : member.gravatar
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
            ))}
          </List>
        </Grid>
      </Grid>
    );
  }
  return <div />;
};

export default Membership;
