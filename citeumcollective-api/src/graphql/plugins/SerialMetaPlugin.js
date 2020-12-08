/*
  Encapsulate plugins to get them executed synchronously, one after one, eg when a plugin depends on the execution of the previous one
 */

const chainPlugins = async (plugins, pluginToMethod, ...args) => {
  // call must be done in a standard loop to get them serialized
  for (let i = 0; i < plugins.length; i += 1) {
    const plugin = plugins[i];
    const method = pluginToMethod(plugin);
    if (method) {
      // eslint-disable-next-line no-await-in-loop
      await method(...args);
    }
  }
};

export default (plugins) => ({
  requestDidStart: (...didStartArgs) => {
    const requestDidStartPlugins = plugins
      .map((p) => p.requestDidStart)
      .filter((m) => m)
      .map((m) => m(...didStartArgs));
    return {
      didResolveOperation: async (...args) => {
        await chainPlugins(requestDidStartPlugins, (p) => p.didResolveOperation, ...args);
      },
      willSendResponse: async (...args) => {
        await chainPlugins(requestDidStartPlugins, (p) => p.willSendResponse, ...args);
      },
    };
  },
});
