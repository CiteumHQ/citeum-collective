import React, { useContext } from 'react';
import { parseISO, format } from 'date-fns';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import {
  pink,
  deepOrange,
  deepPurple,
  yellow,
  indigo,
  teal,
  amber,
} from '@material-ui/core/colors';
import {
  AddOutlined,
  EditOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  HelpOutlined,
} from '@material-ui/icons';
import { Link } from 'react-router-dom';
import { gql } from '@apollo/client';
import { OrganizationContext, UserContext } from '../Context';
import { useBasicQuery } from '../../../network/Apollo';

const useStyles = makeStyles(() => ({
  container: {
    marginTop: 20,
  },
  notification: {
    marginBottom: 20,
  },
  avatar: {
    float: 'left',
    width: 40,
    height: 40,
    marginRight: 20,
  },
  content: {
    height: 50,
    width: 'auto',
    overflow: 'hidden',
  },
  paper: {
    width: '100%',
    height: '100%',
    padding: '17px 15px 15px 15px',
  },
  date: {
    float: 'right',
    textAlign: 'right',
    width: 150,
  },
  description: {
    height: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  noLink: {
    cursor: 'default',
  },
}));

const QUERY_ASSOCIATION_NOTIFICATIONS = gql`
  query GetAssociationNotifications($id: ID!) {
    association(id: $id) {
      id
      notifications {
        id
        date
        type
        content
      }
    }
  }
`;

const Overview = () => {
  const classes = useStyles();
  const { organization, subscription } = useContext(OrganizationContext);
  const { federation } = useContext(UserContext);
  const { data } = useBasicQuery(QUERY_ASSOCIATION_NOTIFICATIONS, {
    id: organization.id,
  });
  const renderIcon = (type) => {
    if (type === 'create') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: pink[500],
            color: '#ffffff',
          }}
        >
          <AddOutlined />
        </Avatar>
      );
    }
    if (type === 'add_file') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: deepPurple[500],
            color: '#ffffff',
          }}
        >
          <CloudUploadOutlined />
        </Avatar>
      );
    }
    if (type === 'delete_file') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: indigo[500],
            color: '#ffffff',
          }}
        >
          <DeleteOutlined />
        </Avatar>
      );
    }
    if (type === 'add_member') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: teal[500],
            color: '#ffffff',
          }}
        >
          <CloudUploadOutlined />
        </Avatar>
      );
    }
    if (type === 'delete_member') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: amber[500],
            color: '#ffffff',
          }}
        >
          <CloudUploadOutlined />
        </Avatar>
      );
    }
    if (type === 'update') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: deepOrange[500],
            color: '#ffffff',
          }}
        >
          <EditOutlined />
        </Avatar>
      );
    }
    return (
      <Avatar
        style={{
          marginTop: 5,
          backgroundColor: yellow[800],
          color: '#ffffff',
        }}
      >
        <HelpOutlined />
      </Avatar>
    );
  };
  if (data && data.association) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Typography variant="h3">Information</Typography>
          <div className={classes.container}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  {organization.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h4">Type of organization</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  className={classes.noLink}
                >
                  {organization.id === federation.id
                    ? 'Federation'
                    : 'Association'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h4">Subscription</Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  component={Link}
                  to={`/dashboard/organizations/${organization.id}/membership`}
                >
                  {subscription ? subscription.name : 'None'}
                </Button>
              </Grid>
            </Grid>
          </div>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h3">Latest notifications</Typography>
          {data.association.notifications.map((notification) => (
            <div key={notification.id} className={classes.container}>
              <div className={classes.notification}>
                <div className={classes.avatar}>
                  {renderIcon(notification.type)}
                </div>
                <div className={classes.content}>
                  <Paper classes={{ root: classes.paper }}>
                    <div className={classes.date}>
                      {format(parseISO(notification.date), 'yyyy-LL-dd kk:mm')}
                    </div>
                    <div className={classes.description}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: notification.content,
                        }}
                      />
                    </div>
                  </Paper>
                </div>
              </div>
            </div>
          ))}
        </Grid>
      </Grid>
    );
  }
  return <div />;
};

export default Overview;
