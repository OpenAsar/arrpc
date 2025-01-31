// NOTE: you may have to run this after onload
(() => {
let Dispatcher, lookupAsset, lookupApp, apps = {};

const ws = new WebSocket('ws://127.0.0.1:1337'); // connect to arRPC bridge websocket
ws.onmessage = async x => {
  msg = JSON.parse(x.data);

  if (!Dispatcher) {
    let wpRequire;
    window.webpackChunkdiscord_app.push([[ Symbol() ], {}, x => wpRequire = x]);
    window.webpackChunkdiscord_app.pop();

    const modules = wpRequire.c;

    for (const id in modules) {
      const mod = modules[id].exports;
      // if (!mod?.__esModule) continue;

      for (const prop in mod) {
        // if (!mod.hasOwnProperty(prop)) continue;

        const candidate = mod[prop];
        try {
          if (candidate && candidate.register && candidate.wait) {
            Dispatcher = candidate;
            break;
          }
        } catch {}
      }

      if (Dispatcher) break;
    }

    const factories = wpRequire.m;
    for (const id in factories) {
      if (factories[id].toString().includes('getAssetImage: size must === [number, number] for Twitch')) {
        const mod = wpRequire(id);

        // fetchAssetIds
        const _lookupAsset = Object.values(mod).find(e => typeof e === 'function' && e.toString().includes('APPLICATION_ASSETS_FETCH_SUCCESS'));
        if (_lookupAsset) lookupAsset = async (appId, name) => (await _lookupAsset(appId, [ name, undefined ]))[0];
      }

      if (lookupAsset) break;
    }

    for (const id in factories) {
      if (factories[id].toString().includes('APPLICATION_RPC(')) {
        const mod = wpRequire(id);

        // fetchApplicationsRPC
        const _lookupApp = Object.values(mod).find(e => {
          if (typeof e !== 'function') return;
          const str = e.toString();
          return str.includes(',coverImage:') && str.includes('INVALID_ORIGIN');
        });
        if (_lookupApp) lookupApp = async appId => {
          let socket = {};
          await _lookupApp(socket, appId);
          return socket.application;
        };
      }

      if (lookupApp) break;
    }
  }

  if (msg.activity?.assets?.large_image) msg.activity.assets.large_image = await lookupAsset(msg.activity.application_id, msg.activity.assets.large_image);
  if (msg.activity?.assets?.small_image) msg.activity.assets.small_image = await lookupAsset(msg.activity.application_id, msg.activity.assets.small_image);

  if (msg.activity) {
    const appId = msg.activity.application_id;
    if (!apps[appId]) apps[appId] = await lookupApp(appId);

    const app = apps[appId];
    if (!msg.activity.name) msg.activity.name = app.name;
  }

  Dispatcher.dispatch({ type: 'LOCAL_ACTIVITY_UPDATE', ...msg }); // set RPC status
};
})();
