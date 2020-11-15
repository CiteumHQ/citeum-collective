import { DEV_MODE, logger } from './config/conf';
import platformInit from './initialization';
import { listenServer, restartServer } from './httpServer';
import { connectDatabase } from './database/postgre';

let server;
const db = connectDatabase();

if (DEV_MODE && module.hot) {
  /* eslint-disable no-console, global-require, import/no-extraneous-dependencies */
  require('webpack/hot/log').setLogLevel('warning');
  module.hot.accept(['./httpServer', './initialization'], async (updated) => {
    const httpUpdated = updated.includes('./src/httpServer.js');
    const appUpdated = updated.includes('./src/initialization.js');
    if (httpUpdated || appUpdated) {
      try {
        server = await restartServer(server);
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
    logger.info(`[FILIGRAN] Starting platform`);
    await platformInit(db);
    server = await listenServer(db);
  } catch (e) {
    process.exit(1);
  }
})();
