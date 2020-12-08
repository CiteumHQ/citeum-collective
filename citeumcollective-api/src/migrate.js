const normalizeMigrationName = (rawName) => {
  if (rawName.startsWith('./')) {
    return rawName.substring(2);
  }
  return rawName;
};

export const retrieveMigrations = () => {
  const webpackMigrationsContext = require.context('./migrations', false, /.js$/);
  return webpackMigrationsContext
    .keys()
    .sort()
    .map((name) => ({ name: normalizeMigrationName(name), migration: webpackMigrationsContext(name) }));
};

const migrate = async (db) => {
  const migrations = retrieveMigrations();
  const migrationSource = {
    getMigrations: async () => migrations,
    getMigrationName: (migration) => migration.name,
    getMigration: (migration) => migration.migration,
  };
  return db.migrate.latest({ migrationSource });
};

export default migrate;
