import { DEV_MODE, logger } from './config/conf';
import platformInit from './initialization';
import { listenServer, restartServer } from './httpServer';
import { connectDatabase } from './database/postgre';
import { connectKeycloak } from './database/keycloak';

let server;
const db = connectDatabase();
let kc;

if (DEV_MODE && module.hot) {
  /* eslint-disable no-console, global-require, import/no-extraneous-dependencies */
  require('webpack/hot/log').setLogLevel('warning');
  module.hot.accept(['./httpServer', './initialization', './database/keycloak.js'], async (updated) => {
    const httpUpdated = updated.includes('./src/httpServer.js');
    const appUpdated = updated.includes('./src/initialization.js');
    if (httpUpdated || appUpdated) {
      try {
        clearInterval(kc);
        kc = await connectKeycloak();
        server = await restartServer(db, server);
        logger.info('[DEV] Application has been successfully hot swapped');
      } catch (e) {
        logger.info('[DEV] Error occurred during hot swap. Node is still serving the last valid application!', {
          error: e,
        });
      }
    }
  });
  /* eslint-enable */
}

(async () => {
  try {
    logger.info(`[CITEUMCOLLECTIVE] Starting platform`);
    kc = await platformInit(db);
    server = await listenServer(db);
  } catch (e) {
    process.exit(1);
  }
})();
