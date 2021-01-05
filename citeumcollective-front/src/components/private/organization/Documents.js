import React, { useContext } from 'react';
import Button from '@material-ui/core/Button';
import * as R from 'ramda';
import { gql } from '@apollo/client';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import {
  EventOutlined,
  SettingsRemoteOutlined,
  DescriptionOutlined,
} from '@material-ui/icons';
import { ScaleBalance } from 'mdi-material-ui';
import { format, parseISO } from 'date-fns';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import DocumentCreation from './DocumentCreation';
import { useBasicQuery } from '../../../network/Apollo';
import DocumentPopover from './DocumentPopover';
import { OrganizationContext, UserContext } from '../Context';

const useStyles = makeStyles(() => ({
  paper: {
    padding: 15,
  },
  date: {
    position: 'absolute',
    cursor: 'default',
  },
  noLink: {
    cursor: 'default',
  },
  noDocument: {
    marginTop: 20,
    fontSize: 15,
    color: '#b4b4b4',
  },
  chips: {
    position: 'absolute',
    right: 200,
  },
}));

const QUERY_ASSOCIATION_DOCUMENTS = gql`
  query Documents($organizationId: ID!) {
    association(id: $organizationId) {
      documents {
        id
        type
        name
        description
        mimetype
        created_at
        memberships {
          id
          name
          color
        }
      }
    }
  }
`;

const Documents = () => {
  const classes = useStyles();
  const { organization } = useContext(OrganizationContext);
  const { me } = useContext(UserContext);
  const { data, refetch } = useBasicQuery(QUERY_ASSOCIATION_DOCUMENTS, {
    organizationId: organization.id,
  });
  const isAdmin = R.includes(`asso_${organization.code}_admin`, me.roles);
  const renderIcon = (type) => {
    switch (type) {
      case 'INFORMATION':
        return <ScaleBalance />;
      case 'MINUTES':
        return <SettingsRemoteOutlined />;
      case 'DOCUM%ENT':
        return <DescriptionOutlined />;
      default:
        return <DescriptionOutlined />;
    }
  };
  const renderList = (documents) => (
    <div style={{ marginTop: 20 }}>
      {documents.length > 0 ? (
        <List style={{ marginTop: -15 }}>
          {documents.map((document) => (
            <ListItem
              key={document.id}
              divider={true}
              button={true}
              component="a"
              href={`/storage/view/${document.id}`}
            >
              <ListItemIcon>{renderIcon(document.type)}</ListItemIcon>
              <ListItemText
                primary={document.name}
                secondary={document.description}
              />
              <div className={classes.chips}>
                {document.memberships.map((membership) => (
                  <Chip
                    key={membership.id}
                    label={membership.name.substring(0, 3).toUpperCase()}
                    variant="outlined"
                    style={{
                      borderColor: membership.color,
                      color: membership.color,
                      marginRight: 10,
                    }}
                  />
                ))}
              </div>
              <Tooltip title="Document date" aria-label="date">
                <Button
                  color="primary"
                  className={classes.date}
                  style={{ right: isAdmin ? 70 : 10 }}
                  startIcon={<EventOutlined />}
                >
                  {format(parseISO(document.created_at), 'yyyy-LL-dd')}
                </Button>
              </Tooltip>
              {isAdmin && (
                <ListItemSecondaryAction>
                  <DocumentPopover
                    id={document.id}
                    refetchDocuments={refetch}
                  />
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <div className={classes.noDocument}>No document here yet.</div>
      )}
    </div>
  );
  if (data && data.association) {
    return (
      <div>
        <Typography variant="h3">Information</Typography>
        <Typography variant="h6">
          Official documents of the organization
        </Typography>
        {renderList(
          R.filter((n) => n.type === 'INFORMATION', data.association.documents),
        )}
        <Divider style={{ width: '100%', margin: '15px 0 15px 0' }} />
        <Typography variant="h3">Minutes</Typography>
        <Typography variant="h6">Official meetings minutes</Typography>
        {renderList(
          R.filter((n) => n.type === 'MINUTES', data.association.documents),
        )}
        {isAdmin && <DocumentCreation refetchDocuments={refetch} />}
      </div>
    );
  }
  return <div />;
};

export default Documents;
