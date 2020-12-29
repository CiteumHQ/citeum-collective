import React from 'react';
import { gql } from '@apollo/client';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { makeStyles } from '@material-ui/core/styles';
import gravatar from 'gravatar';
import Avatar from '@material-ui/core/Avatar';
import { useBasicQuery } from '../../../../network/Apollo';
import OrganizationCreation from './OrganizationCreation';
import OrganizationPopover from './OrganizationPopover';

const useStyles = makeStyles((theme) => ({
  small: {
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
}));

const QUERY_ASSOCIATIONS = gql`
  query GetAssociations {
    associations {
      id
      name
      description
      email
      code
    }
  }
`;

const Organizations = () => {
  const classes = useStyles();
  const { data } = useBasicQuery(QUERY_ASSOCIATIONS, null, {
    pollInterval: 1000,
  });
  if (data && data.associations) {
    const { associations } = data;
    return (
      <div>
        <List>
          {associations.map((association) => {
            const organizationGravatarUrl = gravatar.url(association.email, {
              protocol: 'https',
              s: '100',
            });
            return (
              <ListItem key={association.id} divider={true}>
                <ListItemAvatar>
                  <Avatar
                    src={organizationGravatarUrl}
                    className={classes.small}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={association.name}
                  secondary={association.description}
                />
                <ListItemSecondaryAction>
                  <OrganizationPopover id={association.id} />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
        <OrganizationCreation />
      </div>
    );
  }
  return <div />;
};

export default Organizations;
