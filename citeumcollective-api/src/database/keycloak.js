import KcAdminClient from 'keycloak-admin';
import AsyncLock from 'async-lock';
import * as R from 'ramda';
import { Issuer } from 'openid-client';
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

export const getUserInfo = async (userId) => {
  const api = await kc.get();
  const input = { id: userId };
  const userPromise = api.users.findOne(input);
  const realmRolesPromise = api.users.listRealmRoleMappings(input);
  const [user, realmRoles] = await Promise.all([userPromise, realmRolesPromise]);
  const roles = realmRoles.map((r) => r.name);
  return Object.assign(user, { roles });
};

export const getUsersWithRole = async (name) => {
  const api = await kc.get();
  return api.roles.findUsersWithRole({ name });
};

export const getUserByName = async (username) => {
  const api = await kc.get();
  const findUser = await api.users.find({ username });
  if (findUser.length === 1) {
    return getUserInfo(R.head(findUser).id);
  }
  return null;
};

export const updateUserInfo = async (userId, input) => {
  const api = await kc.get();
  await api.users.update({ id: userId }, input);
  return getUserInfo(userId);
};

export const grantRoleToUser = async (roleName, user) => {
  const api = await kc.get();
  const role = await api.roles.findOneByName({ name: roleName });
  return api.users.addRealmRoleMappings({
    id: user.id,
    roles: [{ id: role.id, name: role.name }],
  });
};

export const createRoleForAssociation = async (association, roleName, description) => {
  const api = await kc.get();
  const roleNameToCreate = roleGen(association, roleName);
  const role = await api.roles.findOneByName({ name: roleNameToCreate });
  if (role) return role.name;
  const input = { name: roleNameToCreate, description };
  await api.roles.create(input);
  return roleNameToCreate;
};

export const deleteAssociationRole = async (association, membership) => {
  const api = await kc.get();
  const roleNameToDelete = roleGen(association, membership.code);
  await api.roles.delByName({ name: roleNameToDelete });
};

export const createAssociationAdminRole = async (association) => {
  return createRoleForAssociation(association, ADMIN_ROLE_CODE, `Admin role for ${association.name}`);
};

export const createApplicationClient = async (association) => {
  const api = await kc.get();
  const input = { name: association.name, clientId: association.code };
  await api.clients.create(input);
};

export const initPlatformAdmin = async () => {
  const email = conf.get('association:admin');
  const assoName = conf.get('association:name');
  const assoCode = conf.get('association:identifier');
  const adminRole = await createAssociationAdminRole({ code: assoCode, name: assoName });
  let user = await getUserByName(email);
  if (user !== null) {
    if (!user.roles.includes(adminRole)) {
      await grantRoleToUser(adminRole, user);
    }
    return user;
  }
  // User doesnt exists
  const api = await kc.get();
  user = await api.users.create({
    email,
    emailVerified: true,
    enabled: true,
  });
  await grantRoleToUser(adminRole, user);
  return user;
};
