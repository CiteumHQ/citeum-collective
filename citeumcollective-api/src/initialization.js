// Admin user initialization
import { logger } from './config/conf';
import migrate from './migrate';
import { initProvider } from './config/authentication';
import { connectKeycloak, initPlatformAdmin } from './database/keycloak';
import { isStorageAlive } from './database/minio';

export const checkSystemDependencies = async () => {
  // Check if minio is here
  await isStorageAlive();
  logger.info(`[CHECK] Minio is alive`);
};

const migrateDatabase = async (db) => {
  try {
    const [batchNo, log] = await migrate(db);
    if (log.length === 0) {
      logger.info('[INIT] Database schema is already up to date');
    } else {
      logger.info('[INIT] Database schema migrated', { batchNo, log });
    }
  } catch (e) {
    logger.error('[INIT] Database schema migration failed', { error: e });
    process.exit(1);
  }
};

const platformInit = async (db) => {
  await checkSystemDependencies();
  try {
    await initProvider(db);
    await connectKeycloak();
    await initPlatformAdmin();
    await migrateDatabase(db);
  } catch (e) {
    logger.error(`[CITEUMCOLLECTIVE] Platform initialization fail`, { error: e });
    throw e;
  }
  return true;
};

export default platformInit;
