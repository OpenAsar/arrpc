import { ipcRenderer } from 'electron';

let Dispatcher, lookupAsset, lookupApp, apps = {};
ipcRenderer.on('rpc', async (event, data) => {
  if (!Dispatcher) {
    const wpRequire = window.webpackChunkdiscord_app.push([[ Symbol() ], {}, x => x]);
    const cache = wpRequire.c;
    window.webpackChunkdiscord_app.pop();

    for (const id in cache) {
      let mod = cache[id].exports;
      for (const prop in mod) {
        const candidate = mod[prop];
          if (candidate && candidate.register && candidate.wait) {
            Dispatcher = candidate;
            break;
          }
      }
      if (Dispatcher) break; // make sure to exit outer loop as well
    }

    const factories = wpRequire.m;
    for (const id in factories) {
      if (factories[id].toString().includes('getAssetImage: size must === [number, number] for Twitch')) {
        const mod = wpRequire(id);

        // fetchAssetIds
        const _lookupAsset = Object.values(mod).find(e => typeof e === "function" && e.toString().includes("APPLICATION_ASSETS_FETCH_SUCCESS"));
        if (_lookupAsset) lookupAsset = async (appId, name) => (await _lookupAsset(appId, [ name, undefined ]))[0];
      }
      if (lookupAsset) break;
    }

    for (const id in factories) {
      if (factories[id].toString().includes("APPLICATION_RPC")) {
        const mod = wpRequire(id);

        // fetchApplicationsRPC
        const _lookupApp = Object.values(mod).find(e => typeof e === "function" && e.toString().includes(",coverImage:"));
        if (_lookupApp) lookupApp = async appId => {
          let socket = {};
          await _lookupApp(socket, appId);
          return socket.application;
        };
      }
      if (lookupApp) break;
    }
  }

  if (data.activity?.assets?.large_image) data.activity.assets.large_image = await lookupAsset(data.activity.application_id, data.activity.assets.large_image);
  if (data.activity?.assets?.small_image) data.activity.assets.small_image = await lookupAsset(data.activity.application_id, data.activity.assets.small_image);

  if (data.activity) {
    const appId = data.activity.application_id;
    if (!apps[appId]) apps[appId] = await lookupApp(appId);

    const app = apps[appId];
    if (!data.activity.name) data.activity.name = app.name;
  }

  Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...data }); // set RPC status
});
