import express from 'express';
import * as R from 'ramda';
// noinspection NodeCoreCodingAssistance
import { readFileSync } from 'fs';
// noinspection NodeCoreCodingAssistance
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import compression from 'compression';
import helmet from 'helmet';
import { isEmpty } from 'ramda';
import nconf from 'nconf';
import RateLimit from 'express-rate-limit';
import sanitize from 'sanitize-filename';
import conf, { COOKIE_NAME, DEV_MODE, logger } from './config/conf';
import passport, { setAuthenticationCookie } from './config/authentication';

const createApp = async (apolloServer) => {
  // Init the http server
  const app = express();
  const limiter = new RateLimit({
    windowMs: nconf.get('app:rate_protection:time_window') * 1000, // seconds
    max: nconf.get('app:rate_protection:max_requests'),
    handler: (req, res /* , next */) => {
      res.status(429).send({ message: 'Too many requests, please try again later.' });
    },
  });
  const sessionSecret = nconf.get('app:session_secret');
  const scriptSrc = ["'self'", "'unsafe-inline'", 'http://cdn.jsdelivr.net/npm/@apollographql/'];
  if (DEV_MODE) scriptSrc.push("'unsafe-eval'");
  app.use(session({ secret: sessionSecret, saveUninitialized: true, resave: true }));
  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());
  app.use(helmet.frameguard());
  app.use(helmet.expectCt({ enforce: true, maxAge: 30 }));
  app.use(helmet.referrerPolicy());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc,
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'http://cdn.jsdelivr.net/npm/@apollographql/',
          'https://fonts.googleapis.com/',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com/'],
        imgSrc: ["'self'", 'data', 'http://cdn.jsdelivr.net/npm/@apollographql/', 'https://map.opencti.io/'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    })
  );
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(limiter);

  // const extractTokenFromBearer = (bearer) => (bearer && bearer.length > 10 ? bearer.substring('Bearer '.length) : null);
  const AppBasePath = nconf.get('app:base_path').trim();
  const contextPath = isEmpty(AppBasePath) || AppBasePath === '/' ? '' : AppBasePath;
  const basePath = isEmpty(AppBasePath) || contextPath.startsWith('/') ? contextPath : `/${contextPath}`;
  const urlencodedParser = bodyParser.urlencoded({ extended: true });

  // -- Generated CSS with correct base path
  app.get(`${basePath}/static/css/*`, (req, res) => {
    const cssFileName = R.last(req.url.split('/'));
    const data = readFileSync(path.join(__dirname, `../public/static/css/${sanitize(cssFileName)}`), 'utf8');
    const withBasePath = data.replace(/%BASE_PATH%/g, basePath);
    res.header('Content-Type', 'text/css');
    res.send(withBasePath);
  });
  app.use(`${basePath}/static`, express.static(path.join(__dirname, '../public/static')));

  // -- File download
  // app.get(`${basePath}/storage/get/:file(*)`, async (req, res) => {
  //   let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  //   token = token || extractTokenFromBearer(req.headers.authorization);
  //   const auth = await authentication(token);
  //   if (!auth) res.sendStatus(403);
  //   const { file } = req.params;
  //   const stream = await downloadFile(file);
  //   res.attachment(file);
  //   stream.pipe(res);
  // });

  // -- File view
  // app.get(`${basePath}/storage/view/:file(*)`, async (req, res) => {
  //   let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  //   token = token || extractTokenFromBearer(req.headers.authorization);
  //   const auth = await authentication(token);
  //   if (!auth) res.sendStatus(403);
  //   const { file } = req.params;
  //   const data = await loadFile(file);
  //   res.setHeader('Content-disposition', `inline; filename="${data.name}"`);
  //   res.setHeader('Content-type', data.metaData.mimetype);
  //   const stream = await downloadFile(file);
  //   stream.pipe(res);
  // });

  app.get(`${basePath}/logout`, (req, res) => {
    req.logout();
    res.clearCookie(COOKIE_NAME);
    res.redirect(conf.get('app:auth_provider:logout_uri'));
  });

  // -- Passport login
  app.get(`${basePath}/login`, (req, res, next) => {
    passport.authenticate('oic')(req, res, next);
  });

  // -- Passport callback
  app.get(`${basePath}/login/callback`, urlencodedParser, passport.initialize(), (req, res, next) => {
    passport.authenticate('oic', (err, user) => {
      if (err || !user) return res.redirect(`${basePath}/auth/oic`);
      setAuthenticationCookie(user, res);
      return res.redirect('/');
    })(req, res, next);
  });

  const serverHealthCheck = () => true;
  apolloServer.applyMiddleware({ app, onHealthCheck: serverHealthCheck, path: `${basePath}/graphql` });

  // Other routes
  app.get('*', (req, res) => {
    const data = readFileSync(`${__dirname}/../public/index.html`, 'utf8');
    const withOptionValued = data.replace(/%BASE_PATH%/g, basePath);
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    return res.send(withOptionValued);
  });

  // Error handling
  app.use((err, req, res, next) => {
    logger.error(`[EXPRESS] Error http call`, { error: err });
    res.redirect('/');
    next();
  });

  return { app };
};

export default createApp;
