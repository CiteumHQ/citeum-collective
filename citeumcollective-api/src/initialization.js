// Admin user initialization
import { logger } from './config/conf';
import migrate from './migrate';
import { initProvider } from './config/authentication';

// Initialize
// const initializeSchema = async (db) => {
//   const schemaFile = path.resolve(__dirname, 'schema.sql');
//   const content = fs.readFileSync(schemaFile, 'utf8');
//   await db.execute({ sql: content });
// };

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

const initializeDefaultValues = async () => {
  logger.info(`[INIT] Initialization of settings and basic elements`);
};

const initializeData = async () => {
  await initializeDefaultValues();
  logger.info(`[INIT] Platform default initialized`);
  return true;
};

const isEmptyPlatform = async () => {
  // TODO
  return true;
};

const platformInit = async (db) => {
  try {
    await initProvider(db);
    await migrateDatabase(db);
    const needToBeInitialized = await isEmptyPlatform();
    if (needToBeInitialized) {
      logger.info(`[INIT] New platform detected, initialization...`);
      // await initializeSchema(db);
      await initializeData();
      // await initializeAdminUser();
    } else {
      logger.info('[INIT] Existing platform detected, initialization...');
      // Always reset the admin user
      // await initializeAdminUser();
    }
  } catch (e) {
    logger.error(`[CITEUMCOLLECTIVE] Platform initialization fail`, { error: e });
    throw e;
  }
  return true;
};

export default platformInit;
