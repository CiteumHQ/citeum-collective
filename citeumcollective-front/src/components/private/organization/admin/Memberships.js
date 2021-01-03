import React from 'react';
import { gql } from '@apollo/client';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { PuzzleHeartOutline } from 'mdi-material-ui';
import { useParams } from 'react-router-dom';
import { useBasicQuery } from '../../../../network/Apollo';
import MembershipCreation from './MembershipCreation';
import MembershipPopover from './MembershipPopover';

const QUERY_ASSOCIATION_MEMBERSHIPS = gql`
  query GetAssociationMemberships($id: ID!) {
    association(id: $id) {
      id
      memberships {
        id
        name
        code
        fee
        description
      }
    }
  }
`;

const Memberships = () => {
  const { organizationId } = useParams();
  const { data, refetch } = useBasicQuery(QUERY_ASSOCIATION_MEMBERSHIPS, {
    id: organizationId,
  });
  if (data && data.association) {
    const { association } = data;
    return (
      <div>
        <List>
          {association.memberships.map((membership) => (
            <ListItem key={membership.id} divider={true}>
              <ListItemIcon>
                <PuzzleHeartOutline />
              </ListItemIcon>
              <ListItemText
                primary={membership.name}
                secondary={membership.description}
              />
              <ListItemSecondaryAction>
                <MembershipPopover
                  id={membership.id}
                  refetchMemberships={refetch}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <MembershipCreation refetchMemberships={refetch} />
      </div>
    );
  }
  return <div />;
};

export default Memberships;
