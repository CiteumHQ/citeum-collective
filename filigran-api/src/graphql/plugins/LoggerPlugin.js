import { dissoc, head, includes } from 'ramda';
import { stripIgnoredCharacters } from 'graphql';
import {DEV_MODE, logger} from '../../config/conf';

const resolveKeyPromises = async (object) => {
  const resolvedObject = {};
  const entries = Object.entries(object).filter(([, value]) => value && typeof value.then === 'function');
  const values = await Promise.all(entries.map(([, value]) => value));
  entries.forEach(([key], index) => {
    resolvedObject[key] = values[index];
  });
  return { ...object, ...resolvedObject };
};

const tryResolveKeyPromises = async (data) => {
  try {
    return [await resolveKeyPromises(data), undefined];
  } catch (e) {
    return [data, e];
  }
};

const API_CALL_MESSAGE = 'API Call'; // If you touch this, you need to change the performance agent
export default {
  requestDidStart: /* istanbul ignore next */ () => {
    const start = Date.now();
    let op;
    return {
      didResolveOperation: (context) => {
        op = context.operationName;
      },
      willSendResponse: async (context) => {
        const stop = Date.now();
        const elapsed = stop - start;
        const size = Buffer.byteLength(JSON.stringify(context.request.variables));
        const isWrite = context.operation && context.operation.operation === 'mutation';
        const contextUser = context.context.user;
        const user = contextUser ? { id: contextUser.id, email: contextUser.email } : undefined;
        const [variables] = await tryResolveKeyPromises(context.request.variables);
        const isCallError = context.errors && context.errors.length > 0;
        // Compute inner relations
        const operationType = `${isWrite ? 'WRITE' : 'READ'}`;
        const callMetaData = {
          user,
          type: operationType + (isCallError ? '_ERROR' : ''),
          operation_query: stripIgnoredCharacters(context.request.query),
          operation: op || 'Unspecified',
          time: elapsed,
          variables,
          size,
        };
        if (isCallError) {
          const currentError = head(context.errors);
          const callError = currentError.originalError ? currentError.originalError : currentError;
          const { data, path, stack } = callError;
          const error = { data, path, stacktrace: stack.split('\n').map((line) => line.trim()) };
          if (includes(callError.name, ['AuthRequired', 'AuthFailure', 'ForbiddenAccess'])) {
            if (!DEV_MODE) {
              logger.warn(API_CALL_MESSAGE, Object.assign(dissoc('variables', callMetaData), { error }));
            }
          } else {
            logger.error(API_CALL_MESSAGE, Object.assign(callMetaData, { error }));
          }
        } else {
          // logger.info(API_CALL_MESSAGE, callMetaData);
        }
      },
    };
  },
};
