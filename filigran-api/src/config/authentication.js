import { Issuer as OpenIDIssuer, Strategy as OpenIDStrategy } from 'openid-client';
import passport from 'passport';
import * as R from 'ramda';
// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import conf, { COOKIE_NAME, logger } from './conf';
import { createUser, getUserByEmail } from '../domain/users';

const computeAccessUserRights = (user) => {
  let access = { global: user.realm_access, ...user.resource_access };
  if (user.email === conf.get('app:admin')) {
    // User is the base association admin, must grant a special access role.
    const clientApp = conf.get('app:auth_provider:client_id');
    const baseRoles = user.resource_access[clientApp].roles;
    const appAdminRole = `${clientApp}_admin`;
    if (!baseRoles.includes(appAdminRole)) {
      baseRoles.push(appAdminRole);
    }
    access = { global: user.realm_access, ...user.resource_access };
  }
  return access;
};

const generateJwtAccessToken = (user) => {
  const access = computeAccessUserRights(user);
  const formattedAccess = R.map(([name, r]) => ({ name, roles: r.roles }), R.toPairs(access));
  const jwtBody = { id: user.sub, accessRights: formattedAccess };
  const jwtOptions = {
    expiresIn: conf.get('app:auth_jwt:expiration'), // will generate the exp claim in the jwtBody
    mutatePayload: true, // this allow to get back the generated exp value after sign operation
  };
  const jwtToken = jwt.sign(jwtBody, conf.get('app:auth_jwt:secret'), jwtOptions);
  return { content: jwtToken, exp: jwtBody.exp };
};

export const setAuthenticationCookie = (user, res) => {
  const jwtAccessToken = generateJwtAccessToken(user);
  res.cookie(COOKIE_NAME, jwtAccessToken.content, {
    httpOnly: true,
    expires: new Date(1000 * jwtAccessToken.exp),
    secure: conf.get('app:cookie_secure'),
  });
};

export const extractUserTokenFromRequest = (req) => {
  const { cookies } = req; // get cookies
  if (cookies) {
    const authCookie = cookies[COOKIE_NAME];
    if (authCookie) {
      try {
        return jwt.verify(authCookie, conf.get('app:auth_jwt:secret'));
      } catch (e) {
        logger.error('Unable to verify JWT token', { token: authCookie, error: e });
      }
    }
  }
  return undefined;
};

const initUserInDatabase = async (db, user) => {
  let existingUser = await getUserByEmail({ db }, user.email);
  if (existingUser === undefined) {
    existingUser = await createUser({ db }, user);
  }
  return existingUser;
};

export const initProvider = (db) => {
  const provider = conf.get('app:auth_provider');
  return OpenIDIssuer.discover(provider.issuer).then((issuer) => {
    const { Client } = issuer;
    const client = new Client(provider);
    const options = { client, params: { scope: 'openid email profile address' } };
    const openIDStrategy = new OpenIDStrategy(options, (tokenset, userInfo, done) => {
      logger.debug(`[OPENID] Successfully logged`, { userInfo });
      const decodedUser = jwt_decode(tokenset.access_token);
      return initUserInDatabase(db, decodedUser).then(() => done(null, decodedUser));
    });
    passport.use('oic', openIDStrategy);
  });
};

export default passport;
