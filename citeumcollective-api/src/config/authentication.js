import { Issuer as OpenIDIssuer, Strategy as OpenIDStrategy } from 'openid-client';
import passport from 'passport';
// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import conf, { COOKIE_NAME, logger } from './conf';
import { createUser, getUser, getUserByEmail, isUserExists } from '../domain/users';

const generateJwtAccessToken = (user) => {
  const jwtBody = { id: user.sub };
  const jwtOptions = {
    expiresIn: conf.get('app:auth_jwt:expiration'), // will generate the exp claim in the jwtBody
    mutatePayload: true, // this allow to get back the generated exp value after sign operation
  };
  const jwtToken = jwt.sign(jwtBody, conf.get('app:auth_jwt:secret'), jwtOptions);
  return { content: jwtToken, exp: jwtBody.exp };
};

export const setAuthenticationCookie = (user, res) => {
  if (!user) {
    return;
  }
  const jwtAccessToken = generateJwtAccessToken(user);
  res.cookie(COOKIE_NAME, jwtAccessToken.content, {
    httpOnly: true,
    expires: new Date(1000 * jwtAccessToken.exp),
    secure: conf.get('app:cookie_secure'),
  });
};

const extractUserTokenFromRequest = (req) => {
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

export const extractUserFromRequest = (ctx, req) => {
  const extractedUser = extractUserTokenFromRequest(req);
  if (extractedUser) {
    return getUser(ctx, extractedUser.id);
  }
  return undefined;
};

const initUserInDatabase = async (db, user) => {
  const isExists = await isUserExists({ db }, user.email);
  if (!isExists) {
    return createUser({ db }, user);
  }
  return getUserByEmail({ db }, user.email);
};

export const initProvider = (db) => {
  const provider = { ...{ client_id: conf.get('association:identifier') }, ...conf.get('app:auth_provider') };
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
