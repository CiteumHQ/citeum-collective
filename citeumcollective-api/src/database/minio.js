import * as Minio from 'minio';
import querystring from 'querystring';
import conf, { logger } from '../config/conf';

const bucketName = conf.get('minio:bucket_name') || 'citeum-bucket';
const bucketRegion = conf.get('minio:bucket_region') || 'us-east-1';

const minioClient = new Minio.Client({
  endPoint: conf.get('minio:endpoint'),
  port: conf.get('minio:port') || 9000,
  useSSL: conf.get('minio:use_ssl') || false,
  accessKey: conf.get('minio:access_key'),
  secretKey: conf.get('minio:secret_key'),
});

export const isStorageAlive = () => {
  return new Promise((resolve, reject) => {
    try {
      minioClient.bucketExists(bucketName, (existErr, exists) => {
        if (existErr) reject(existErr);
        if (!exists) {
          minioClient.makeBucket(bucketName, bucketRegion, (createErr) => {
            if (createErr) reject(createErr);
            resolve(true);
          });
        }
        resolve(exists);
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const deleteFile = async (id) => {
  await minioClient.removeObject(bucketName, id);
  return true;
};

export const downloadFile = (id) => minioClient.getObject(bucketName, id);

export const upload = async (path, file, metadata = {}) => {
  const { createReadStream, filename, mimetype, encoding } = await file;
  const escapeName = querystring.escape(filename);
  const internalMeta = { filename: escapeName, mimetype, encoding };
  const fileMeta = { ...metadata, ...internalMeta };
  const fileDirName = `${path}/${filename}`;
  // Upload the file in the storage
  return new Promise((resolve, reject) => {
    return minioClient.putObject(bucketName, fileDirName, createReadStream(), null, fileMeta, (err) => {
      if (err) return reject(err);
      return resolve({ id: fileDirName, mimetype });
    });
  });
};

export const getMinIOVersion = () => {
  const serverHeaderPrefix = 'MinIO/';
  return new Promise((resolve) => {
    // MinIO server information is included in the "Server" header of the
    // response. Make "bucketExists" request to get the header value.
    minioClient.makeRequest({ method: 'HEAD', bucketName }, '', 200, '', true, (err, response) => {
      /* istanbul ignore if */
      if (err) {
        logger.error('[MINIO] Error requesting server version: ', { error: err });
        resolve('Disconnected');
        return;
      }
      const serverHeader = response.headers.server || '';
      /* istanbul ignore else */
      if (serverHeader.startsWith(serverHeaderPrefix)) {
        const version = serverHeader.substring(serverHeaderPrefix.length);
        resolve(version);
      } else {
        // logger.error(`[MINIO] Unexpected Server header`, { headers: serverHeader });
        resolve('Latest');
      }
    });
  });
};
