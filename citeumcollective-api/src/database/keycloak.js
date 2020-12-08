import KcAdminClient from 'keycloak-admin';
import normalize from 'normalize-name';
import { Issuer } from 'openid-client';
import conf from '../config/conf';

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

const ROLE_ROOT = 'root';
export const getUserInfo = async (userId) => {
  const input = { id: userId };
  const user = await basic().users.findOne(input);
  const realmRoles = await basic().users.listRealmRoleMappings(input);
  const roles = realmRoles.map((r) => r.name);
  if (user.email === conf.get('app:admin') && !roles.includes(ROLE_ROOT)) {
    roles.push(ROLE_ROOT);
  }
  return Object.assign(user, { roles });
};

export const updateUserInfo = async (userId, input) => {
  await basic().users.update({ id: userId }, input);
  return getUserInfo(userId);
};

export const associationClientId = (association) => normalize(association.name).toLowerCase();

export const grantRoleToUser = async (roleName, user) => {
  const role = await basic().roles.findOneByName({ name: roleName });
  return basic().users.addRealmRoleMappings({
    id: user.id,
    roles: [{ id: role.id, name: role.name }],
  });
};

export const createAssociationAdminRole = async (association) => {
  const roleName = `${associationClientId(association)}_admin`;
  const input = { name: roleName, description: `Admin role for ${association.name}` };
  await basic().roles.create(input);
  return roleName;
};

export const createApplicationClient = async (association) => {
  const input = { name: association.name, clientId: associationClientId(association) };
  await basic().clients.create(input);
};
