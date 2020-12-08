import nconf from 'nconf';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const DEFAULT_ENV = 'production';
export const COOKIE_NAME = 'citeumcollective';
export const MAIN_ASSOCIATION_ID = '7720784e-25d1-41a7-9fcb-172e523aec0b';

// Environment from NODE_ENV environment variable
nconf.env({ separator: '__', lowerCase: true, parseValues: true });

// Environment from "-e" command line parameter
nconf.add('argv', {
  e: {
    alias: 'env',
    describe: 'Execution environment',
  },
  c: {
    alias: 'conf',
    describe: 'Configuration file',
  },
});

const { timestamp } = format;
const currentPath = process.env.INIT_CWD || process.cwd();
const resolvePath = (relativePath) => path.join(currentPath, relativePath);
const environment = nconf.get('env') || nconf.get('node_env') || DEFAULT_ENV;
const resolveEnvFile = (env) => path.join(resolvePath('config'), `${env.toLowerCase()}.json`);
export const DEV_MODE = environment !== 'production';
const externalConfigurationFile = nconf.get('conf');
let configurationFile;
if (externalConfigurationFile) {
  configurationFile = externalConfigurationFile;
} else {
  configurationFile = resolveEnvFile(environment);
}

nconf.file(environment, configurationFile);
nconf.file('default', resolveEnvFile('default'));

// Setup logger
const loggerInstance = winston.createLogger({
  level: nconf.get('app:logs_level'),
  format: format.combine(timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new DailyRotateFile({
      filename: 'error.log',
      dirname: nconf.get('app:logs'),
      level: 'error',
      maxFiles: '30',
    }),
    new DailyRotateFile({
      filename: 'opencti.log',
      dirname: nconf.get('app:logs'),
      maxFiles: '30',
    }),
    new winston.transports.Console(),
  ],
});

// Specific case to fail any test that produce an error log
if (environment === 'test') {
  loggerInstance.on('data', (log) => {
    if (log.level === 'error') throw Error(log.message);
  });
}

export const logger = {
  debug: (message, meta) => loggerInstance.debug(message, meta),
  info: (message, meta) => loggerInstance.info(message, meta),
  warn: (message, meta) => loggerInstance.warn(message, meta),
  error: (message, meta) => loggerInstance.error(message, meta),
};

const config = {
  resolvePath,
  inDev: environment === 'development',
  get: (confPath) => nconf.get(confPath),
};

export default config;
