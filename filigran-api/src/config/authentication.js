import { Issuer as OpenIDIssuer, Strategy as OpenIDStrategy } from 'openid-client';
import passport from 'passport';
import * as jwt from 'jsonwebtoken';
import conf, { COOKIE_NAME, logger } from './conf';
import { createUser, getUserByEmail } from '../domain/users';

const generateJwtAccessToken = (user) => {
  const jwtBody = { email: user.email };
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
        const jwtBody = jwt.verify(authCookie, conf.get('app:auth_jwt:secret'));
        return { email: jwtBody.email, expirationTime: jwtBody.exp };
      } catch (e) {
        logger.error('Unable to verify JWT token', { token: authCookie, error: e });
      }
    }
  }
  return undefined;
};

const loginFromProvider = async (db, email) => {
  let user = await getUserByEmail({ db }, email);
  if (user === undefined) {
    user = await createUser({ db }, { email });
  }
  return user;
};

export const initProvider = (db) => {
  const provider = conf.get('app:auth_provider');
  return OpenIDIssuer.discover(provider.issuer).then((issuer) => {
    const { Client } = issuer;
    const client = new Client(provider);
    const options = { client, params: { scope: 'openid email profile' } };
    const openIDStrategy = new OpenIDStrategy(options, (tokenset, userinfo, done) => {
      logger.debug(`[OPENID] Successfully logged`, { userinfo });
      const { email } = userinfo;
      return loginFromProvider(db, email)
        .then((user) => {
          done(null, user);
        })
        .catch((err) => {
          logger.warn(`[OPENID] Login error`, { error: err });
          done(err);
        });
    });
    passport.use('oic', openIDStrategy);
  });
};

export default passport;
