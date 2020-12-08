// noinspection NodeCoreCodingAssistance
import http from 'http';
import conf, { logger } from './config/conf';
import createApp from './app';
import createApolloServer from './graphql/graphql';

const PORT = conf.get('app:port');
// const broadcaster = initBroadcaster();
const createHttpServer = async (db, kc) => {
  const apolloServer = createApolloServer(db, kc);
  const { app, seeMiddleware } = await createApp(apolloServer);
  const httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);
  // await broadcaster.start();
  return { httpServer, seeMiddleware };
};

export const listenServer = async (db) => {
  return new Promise((resolve, reject) => {
    try {
      const serverPromise = createHttpServer(db);
      serverPromise.then(({ httpServer }) => {
        httpServer.on('close', () => {
          // seeMiddleware.shutdown();
        });
        httpServer.listen(PORT, () => {
          logger.info(`[FILIGRAN] Servers ready on port ${PORT}`);
          resolve(httpServer);
        });
      });
    } catch (e) {
      logger.error(`[FILIGRAN] Start http server fail`, { error: e });
      reject(e);
    }
  });
};
export const restartServer = async (db, httpServer) => {
  return new Promise((resolve, reject) => {
    httpServer.close(() => {
      logger.info('[FILIGRAN] GraphQL server stopped');
      listenServer(db)
        .then((server) => resolve(server))
        .catch((e) => reject(e));
    });
    httpServer.emit('close'); // force server close
  });
};
export const stopServer = async (httpServer) => {
  return new Promise((resolve) => {
    httpServer.close(() => {
      resolve();
    });
    httpServer.emit('close'); // force server close
  });
};

export default createHttpServer;
