import React from 'react';
import { gql } from '@apollo/client';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import Avatar from '@material-ui/core/Avatar';
import { useParams } from 'react-router-dom';
import Chip from '@material-ui/core/Chip';
import { useBasicQuery } from '../../../../network/Apollo';

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
}));

const QUERY_ASSOCIATION_MEMBERS = gql`
  query GetAssociationMembers($id: ID!) {
    association(id: $id) {
      id
      members {
        firstName
        lastName
        email
        subscription(associationId: $id) {
          id
          name
          code
          description
        }
      }
    }
  }
`;

const Members = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { data } = useBasicQuery(QUERY_ASSOCIATION_MEMBERS, {
    id: organizationId,
  });
  if (data && data.association) {
    const { association } = data;
    return (
      <div>
        <List>
          {association.members.map((member) => {
            const memberGravatarUrl = gravatar.url(member.email, {
              protocol: 'https',
              s: '100',
            });
            return (
              <ListItem key={member.id} divider={true}>
                <ListItemAvatar>
                  <Avatar src={memberGravatarUrl} className={classes.small} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.firstName} ${member.lastName}`}
                  secondary={member.email}
                />
                <Chip
                  label={`${member.subscription.name}`}
                  variant="outlined"
                  className={classes.subscription}
                  color="secondary"
                />
              </ListItem>
            );
          })}
        </List>
      </div>
    );
  }
  return <div />;
};

export default Members;
