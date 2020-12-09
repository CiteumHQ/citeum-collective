import KcAdminClient from 'keycloak-admin';
import * as R from 'ramda';
import { Issuer } from 'openid-client';
import conf from '../config/conf';
import { ROLE_ASSO_PREFIX, ROLE_ASSO_SEPARATOR } from './constants';

const kcAdminClient = new KcAdminClient({
  baseUrl: `${conf.get('keycloak:uri')}/auth`,
});

// Authorize with username / password
export const connectKeycloak = async () => {
  const username = conf.get('keycloak:username');
  const password = conf.get('keycloak:password');
  await kcAdminClient.auth({
    username,
    password,
    grantType: 'password',
    clientId: 'admin-cli',
  });
  const keycloakIssuer = await Issuer.discover(`${conf.get('keycloak:uri')}/auth/realms/master`);
  const client = new keycloakIssuer.Client({
    client_id: 'admin-cli', // Same as `clientId` passed to client.auth()
    token_endpoint_auth_method: 'none', // to send only client_id in the header
  });
  let tokenSet = await client.grant({
    grant_type: 'password',
    username,
    password,
  });
  // Periodically using refresh_token grant flow to get new access token here
  return setInterval(async () => {
    const refreshToken = tokenSet.refresh_token;
    tokenSet = await client.refresh(refreshToken);
    kcAdminClient.setAccessToken(tokenSet.access_token);
  }, 58 * 1000); // 58 seconds
};

const basic = () => {
  kcAdminClient.setConfig({ realmName: conf.get('association:identifier') });
  return kcAdminClient;
};

export const getUserInfo = async (userId) => {
  const input = { id: userId };
  const userPromise = basic().users.findOne(input);
  const realmRolesPromise = basic().users.listRealmRoleMappings(input);
  const [user, realmRoles] = await Promise.all([userPromise, realmRolesPromise]);
  const roles = realmRoles.map((r) => r.name);
  return Object.assign(user, { roles });
};

export const getUserByName = async (username) => {
  const findUser = await basic().users.find({ username });
  if (findUser.length === 1) {
    return getUserInfo(R.head(findUser).id);
  }
  return null;
};

export const updateUserInfo = async (userId, input) => {
  await basic().users.update({ id: userId }, input);
  return getUserInfo(userId);
};

export const grantRoleToUser = async (roleName, user) => {
  const role = await basic().roles.findOneByName({ name: roleName });
  return basic().users.addRealmRoleMappings({
    id: user.id,
    roles: [{ id: role.id, name: role.name }],
  });
};

export const createAssociationRole = async (association, roleName) => {
  const roleNameToCreate = `${ROLE_ASSO_PREFIX}${association.code}${ROLE_ASSO_SEPARATOR}${roleName}`;
  const role = await basic().roles.findOneByName({ name: roleNameToCreate });
  if (role) return role.name;
  const input = { name: roleNameToCreate, description: `Admin role for ${association.name}` };
  await basic().roles.create(input);
  return roleNameToCreate;
};

export const createAssociationAdminRole = async (association) => {
  return createAssociationRole(association, `admin`);
};

export const createApplicationClient = async (association) => {
  const input = { name: association.name, clientId: association.code };
  await basic().clients.create(input);
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
  user = await basic().users.create({
    email,
    emailVerified: true,
    enabled: true,
  });
  await grantRoleToUser(adminRole, user);
  return user;
};
