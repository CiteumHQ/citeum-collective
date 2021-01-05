import React from 'react';
import { gql } from '@apollo/client';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { makeStyles } from '@material-ui/core/styles';
import { useParams } from 'react-router-dom';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { useBasicQuery } from '../../../../network/Apollo';
import AuthenticationPopover from './AuthenticationPopover';
import AddAuthentication from './AddAuthentication';

const useStyles = makeStyles((theme) => ({
  logo: {
    width: 40,
    float: 'left',
  },
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

const QUERY_CLIENTS = gql`
  query GetAssociationClients($id: ID!) {
    association(id: $id) {
      id
      clients {
        id
        application {
          logo_url
          name
        }
        configuration {
          protocol
          client_id
          client_secret
          issuer
        }
      }
    }
  }
`;

const Authentications = () => {
  const classes = useStyles();
  const { organizationId } = useParams();
  const { data, refetch } = useBasicQuery(QUERY_CLIENTS, {
    id: organizationId,
  });
  if (data && data.association) {
    const { association } = data;
    return (
      <div>
        <List style={{ marginTop: -15 }}>
          {association.clients.map((client) => (
              <ListItem key={client.id} divider={true}>
                <ListItemAvatar>
                  <img src={client.application.logo_url} className={classes.logo} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${client.application.name} (${client.configuration.protocol})`}
                  secondary={`client_id : ${client.configuration.client_id} - client_secret : ${client.configuration.client_secret}`}
                />
                <ListItemSecondaryAction>
                  <AuthenticationPopover clientId={client.id} refetchAuthentications={refetch} />
                </ListItemSecondaryAction>
              </ListItem>
          ))}
        </List>
        <AddAuthentication refetchAuthentications={refetch}/>
      </div>
    );
  }
  return <div />;
};

export default Authentications;
