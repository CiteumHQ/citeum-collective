import React, { useContext } from 'react';
import { parseISO, format } from 'date-fns';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import BarChart from 'recharts/lib/chart/BarChart';
import XAxis from 'recharts/lib/cartesian/XAxis';
import YAxis from 'recharts/lib/cartesian/YAxis';
import Cell from 'recharts/lib/component/Cell';
import Bar from 'recharts/lib/cartesian/Bar';
import ResponsiveContainer from 'recharts/lib/component/ResponsiveContainer';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import {
  pink,
  green,
  cyan,
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
  PersonAddOutlined,
  VisibilityOutlined,
} from '@material-ui/icons';
import { HeartPlusOutline, HeartRemoveOutline } from 'mdi-material-ui';
import { Link } from 'react-router-dom';
import { gql } from '@apollo/client';
import * as R from 'ramda';
import { OrganizationContext, UserContext } from '../Context';
import { useBasicQuery } from '../../../network/Apollo';

const useStyles = makeStyles(() => ({
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
  paperContainer: {
    padding: 15,
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
  table: {
    backgroundColor: 'transparent',
  },
}));

const QUERY_ASSOCIATION = gql`
  query GetAssociation($id: ID!) {
    association(id: $id) {
      id
      notifications {
        id
        date
        type
        content
      }
      members {
        id
        firstName
        lastName
        email
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

const Overview = () => {
  const classes = useStyles();
  const { organization, subscription } = useContext(OrganizationContext);
  const { federation } = useContext(UserContext);
  const { data } = useBasicQuery(QUERY_ASSOCIATION, {
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
          <PersonAddOutlined />
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
    if (type === 'add_membership') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: green[500],
            color: '#ffffff',
          }}
        >
          <HeartPlusOutline />
        </Avatar>
      );
    }
    if (type === 'delete_membership') {
      return (
        <Avatar
          style={{
            marginTop: 5,
            backgroundColor: cyan[500],
            color: '#ffffff',
          }}
        >
          <HeartRemoveOutline />
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
    const members = R.pipe(
      R.map((n) => ({
        name: n.is_organization
          ? n.organization
          : `${n.firstName} ${n.lastName}`,
        email: n.email,
        subscription_date: n.subscription.subscriptionInfo.subscription_date,
        subscription_name: n.subscription.name,
        subscription_color: n.subscription.color,
      })),
      R.uniqBy(R.prop('name')),
      R.sortWith([R.ascend(R.prop('subscription_date'))]),
    )(data.association.members);
    const colors = {};
    for (const member of members) {
      colors[member.subscription_name] = member.subscription_color;
    }
    const membersDistribution = R.pipe(
      R.countBy(R.prop('subscription_name')),
      R.toPairs,
      R.map((n) => ({ label: n[0], value: n[1], color: colors[n[0]] })),
      R.sortWith([R.descend(R.prop('value'))]),
    )(members);
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper
            variant="outlined"
            elevation={2}
            classes={{ root: classes.paperContainer }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h3">Information</Typography>
                <Typography variant="subtitle1">
                  {organization.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Type of organization</Typography>
                <Button
                  variant="outlined"
                  color="inherit"
                  className={classes.noLink}
                >
                  {organization.id === federation.id
                    ? 'Federation'
                    : 'Association'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h3">Subscription</Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  to={`/dashboard/organizations/${organization.id}/membership`}
                  style={{
                    border: `1px solid ${subscription.color}`,
                    color: subscription.color,
                  }}
                >
                  {subscription ? subscription.name : 'None'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Grid container spacing={3} style={{ marginTop: 20 }}>
            <Grid item xs={12}>
              <Typography variant="h3" style={{ float: 'left' }}>
                Number of members
              </Typography>
              <Button
                style={{ float: 'left', margin: '-5px 0 0 10px' }}
                color="secondary"
                endIcon={<VisibilityOutlined />}
                component={Link}
                to={`/dashboard/organizations/${organization.id}/membership`}
              >
                View all
              </Button>
              <div className="clearfix" />
              <ResponsiveContainer height={280} width="100%">
                <BarChart
                  layout="vertical"
                  data={membersDistribution}
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <XAxis
                    type="number"
                    dataKey="value"
                    stroke="#ffffff"
                    allowDecimals={false}
                  />
                  <YAxis
                    stroke="#ffffff"
                    dataKey="label"
                    type="category"
                    angle={-30}
                    textAnchor="end"
                  />
                  <Bar dataKey="value" barSize={20}>
                    {membersDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
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
                      {format(parseISO(notification.date), 'yyyy-LL-dd HH:mm')}
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
