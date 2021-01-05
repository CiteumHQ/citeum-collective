import KcAdminClient from 'keycloak-admin';
import AsyncLock from 'async-lock';
import * as R from 'ramda';
import { Issuer } from 'openid-client';
import { v4 as uuidv4 } from 'uuid';
import conf from '../config/conf';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from './constants';

const lock = new AsyncLock();
const LOCK_KEY = 'kc_lock';
const TOKEN_REFRESH_TIME_LIMIT = 58 * 1000;
const kc = {
  client: new KcAdminClient({
    baseUrl: `${conf.get('keycloak:uri')}/auth`,
  }),
  issuer: null,
  initAt: new Date(),
  refreshToken: null,
  // eslint-disable-next-line
  get: async function() {
    // Get use the real for the default association
    this.client.setConfig({ realmName: conf.get('association:identifier') });
    // Take a lock to prevent refreshing the token multiple times
    await lock.acquire(LOCK_KEY, async () => {
      const now = new Date();
      const sinceLastRefresh = now.getTime() - this.initAt.getTime();
      // If token is about to expire, refresh it
      if (sinceLastRefresh > TOKEN_REFRESH_TIME_LIMIT) {
        const tokenSet = await this.issuer.refresh(this.refreshToken);
        this.client.setAccessToken(tokenSet.access_token);
        this.initAt = now;
      }
    });
    return this.client;
  },
};

export const ADMIN_ROLE_CODE = `admin`;
export const roleGen = (association, roleName) =>
  `${ROLE_ASSO_PREFIX}${association.code}${ROLE_ASSO_SEPARATOR}${roleName}`;

// Authorize with username / password
export const connectKeycloak = async () => {
  const username = conf.get('keycloak:username');
  const password = conf.get('keycloak:password');
  await kc.client.auth({
    username,
    password,
    grantType: 'password',
    clientId: 'admin-cli',
  });
  const keycloakIssuer = await Issuer.discover(`${conf.get('keycloak:uri')}/auth/realms/master`);
  const issuer = new keycloakIssuer.Client({
    client_id: 'admin-cli', // Same as `clientId` passed to client.auth()
    token_endpoint_auth_method: 'none', // to send only client_id in the header
  });
  const tokenSet = await issuer.grant({
    grant_type: 'password',
    username,
    password,
  });
  kc.client.setAccessToken(tokenSet.access_token);
  kc.issuer = issuer;
  kc.refreshToken = tokenSet.refresh_token;
};

export const kcResetPassword = async (userId, password, temporary = false) => {
  const api = await kc.get();
  await api.users.resetPassword({
    id: userId,
    credential: {
      temporary,
      type: 'password',
      value: password,
    },
  });
};

export const kcGetAllUsers = async () => {
  const api = await kc.get();
  return api.users.find();
};

export const kcGetUserInfo = async (userId) => {
  const api = await kc.get();
  const input = { id: userId };
  return api.users.findOne(input);
};

export const kcGetUsersWithRole = async (name) => {
  const api = await kc.get();
  return api.roles.findUsersWithRole({ name });
};

export const kcGetUserByName = async (username) => {
  const api = await kc.get();
  const findUser = await api.users.find({ username });
  if (findUser.length === 1) {
    return kcGetUserInfo(R.head(findUser).id);
  }
  return null;
};

export const kcUpdateUserInfo = async (userId, input) => {
  const api = await kc.get();
  await api.users.update({ id: userId }, input);
  return kcGetUserInfo(userId);
};

export const kcGrantRoleToUser = async (roleName, user) => {
  const api = await kc.get();
  const role = await api.roles.findOneByName({ name: roleName });
  return api.users.addRealmRoleMappings({
    id: user.id,
    roles: [{ id: role.id, name: role.name }],
  });
};

export const kcRemoveRoleFromUser = async (roleName, user) => {
  const api = await kc.get();
  const role = await api.roles.findOneByName({ name: roleName });
  return api.users.delRealmRoleMappings({
    id: user.id,
    roles: [{ id: role.id, name: role.name }],
  });
};

export const kcGetRolesForAssociation = async (association) => {
  const api = await kc.get();
  const roles = await api.roles.find();
  return R.filter((n) => n.name.startsWith(`${ROLE_ASSO_PREFIX}${association.name}`), roles);
};

export const kcCreateRoleForAssociation = async (association, roleName, description) => {
  const api = await kc.get();
  const roleNameToCreate = roleGen(association, roleName);
  const role = await api.roles.findOneByName({ name: roleNameToCreate });
  if (role) return role.name;
  const input = { name: roleNameToCreate, description };
  await api.roles.create(input);
  return roleNameToCreate;
};

export const kcDeleteAssociationRole = async (association, membership) => {
  const api = await kc.get();
  const roleNameToDelete = roleGen(association, membership.code);
  await api.roles.delByName({ name: roleNameToDelete });
};

export const kcDeleteAssociationRoles = async (association) => {
  const api = await kc.get();
  const associationRoles = await kcGetRolesForAssociation(association);
  return Promise.all(
    associationRoles.map((role) => {
      return api.roles.delByName({ name: role.name });
    })
  );
};

export const kcCreateAssociationAdminRole = async (association) => {
  return kcCreateRoleForAssociation(association, ADMIN_ROLE_CODE, `Admin role for ${association.name}`);
};

export const kcCreateApplicationClient = async (association, application) => {
  const id = uuidv4();
  const api = await kc.get();
  const name = `${association.name} ${application.name}`;
  const url = application.url.endsWith('/') ? `${application.url}*` : `${application.url}/*`;
  const input = {
    name,
    publicClient: false,
    clientId: id,
    protocol: 'openid-connect',
    redirectUris: [url],
    webOrigins: [url],
  };
  const createdClient = await api.clients.create(input);
  return createdClient.id;
};

export const kcGetClient = async (client) => {
  const api = await kc.get();
  const cli = await api.clients.findOne({ id: client.id });
  const credential = await api.clients.getClientSecret({ id: client.id });
  const issuer = conf.get('app:auth_provider:issuer');
  return { ...cli, client_id: cli.clientId, client_secret: credential.value, issuer };
};

export const kcDeleteClient = async (clientId) => {
  const api = await kc.get();
  await api.clients.del({ id: clientId });
};

export const kcCreateUser = async (email) => {
  const api = await kc.get();
  return api.users.create({
    email,
    emailVerified: true,
    enabled: true,
  });
};
