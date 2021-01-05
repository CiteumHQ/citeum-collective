import React from 'react';
import { gql } from '@apollo/client';
import * as R from 'ramda';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import { useParams } from 'react-router-dom';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import { EventOutlined, ScheduleOutlined } from '@material-ui/icons';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { format, parseISO } from 'date-fns';
import { useBasicQuery } from '../../../../network/Apollo';
import AddMember from './AddMember';
import MemberPopover from './MemberPopover';

const useStyles = makeStyles((theme) => ({
  small: {
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
  subscription: {
    borderRadius: 5,
    position: 'absolute',
    right: 100,
    width: 150,
  },
  subscriptionRenewal: {
    position: 'absolute',
    right: 300,
    cursor: 'default',
  },
  subscriptionDate: {
    position: 'absolute',
    right: 450,
    cursor: 'default',
  },
}));

const QUERY_ASSOCIATION_MEMBERS = gql`
  query GetAssociationMembers($id: ID!) {
    association(id: $id) {
      id
      members {
        id
        email
        providerInfo {
          firstName
          lastName
        }
        subscription(associationId: $id) {
          id
          subscription_date
          subscription_last_update
          subscription_next_update
          membership {
            id
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

const Members = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { data, refetch } = useBasicQuery(QUERY_ASSOCIATION_MEMBERS, {
    id: organizationId,
  });
  if (data && data.association) {
    const { association } = data;
    const members = R.pipe(
      R.map((n) => R.assoc('subscriptionDate', n.subscription.subscription_date, n)),
      R.sortWith([R.ascend(R.prop('subscriptionDate'))]),
    )(association.members);
    return (
      <div>
        <List style={{ marginTop: -15 }}>
          {members.map((member) => (
              <ListItem key={member.id} divider={true}>
                <ListItemAvatar>
                  <Avatar src={member.gravatar} className={classes.small} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.providerInfo.firstName} ${member.providerInfo.lastName}`}
                  secondary={member.email}
                />
                <Tooltip
                  title="Subscription date"
                  aria-label="subscriptionDate"
                >
                  <Button
                    color="primary"
                    className={classes.subscriptionDate}
                    startIcon={<EventOutlined />}
                  >
                    {format(
                      parseISO(member.subscription.subscription_date),
                      'yyyy-LL-dd',
                    )}
                  </Button>
                </Tooltip>
                <Tooltip title="Next update" aria-label="nextUpdate">
                  <Button
                    color="primary"
                    className={classes.subscriptionRenewal}
                    startIcon={<ScheduleOutlined />}
                  >
                    {format(
                      parseISO(member.subscription.subscription_next_update),
                      'yyyy-LL-dd',
                    )}
                  </Button>
                </Tooltip>
                <Chip
                  label={member.subscription.membership.name}
                  variant="outlined"
                  className={classes.subscription}
                  style={{
                    border: `1px solid ${member.subscription.membership.color}`,
                    color: member.subscription.membership.color,
                  }}
                />
                <ListItemSecondaryAction>
                  <MemberPopover
                    associationId={organizationId}
                    userId={member.id}
                    subscription={member.subscription}
                    refetchMembers={refetch}
                  />
                </ListItemSecondaryAction>
              </ListItem>
          ))}
        </List>
        <AddMember refetchMembers={refetch} />
      </div>
    );
  }
  return <div />;
};

export default Members;
