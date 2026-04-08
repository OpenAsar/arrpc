// NOTE: you may have to run this after onload
(() => {
let Dispatcher, lookupAsset, lookupApp, apps = {};

const eachCandidate = (mod, fn) => {
  if (!mod) return;

  try { fn(mod); } catch {}
  try { if (mod.default) fn(mod.default); } catch {}
  try {
    for (const key of Reflect.ownKeys(mod)) {
      try { fn(mod[key]); } catch {}
    }
  } catch {}
};

const getWebpackRequire = () => {
  const reqs = [];
  const seen = new Set();

  window.webpackChunkdiscord_app.push([[ Symbol() ], {}, req => {
    if (req && !seen.has(req)) {
      seen.add(req);
      reqs.push(req);
    }
  }]);
  window.webpackChunkdiscord_app.pop();

  const hasSource = (req, ...needles) => {
    for (const id in req?.m) {
      let source;
      try {
        source = req.m[id]?.toString?.();
      } catch {
        continue;
      }

      if (source && needles.every(needle => source.includes(needle))) return true;
    }
    return false;
  };

  return reqs.find(req =>
    hasSource(req, 'getAssetImage: size must === [') &&
    hasSource(req, 'Invalid Origin', 'coverImage', '.application')
  ) || reqs.at(-1);
};

const findModule = (wpRequire, ...needles) => {
  for (const id in wpRequire.m) {
    let source;
    try {
      source = wpRequire.m[id]?.toString?.();
    } catch {
      continue;
    }

    if (!source || !needles.every(needle => source.includes(needle))) continue;

    try {
      return wpRequire(id);
    } catch {}
  }
};

const findInCache = (wpRequire, test, depth = 4) => {
  const seen = new WeakSet();
  let found;

  const walk = (value, remainingDepth) => {
    if (found || !value || (typeof value !== 'object' && typeof value !== 'function')) return;
    if (value === window || value === document || value === globalThis) return;
    if (seen.has(value)) return;
    seen.add(value);

    try {
      if (test(value)) {
        found = value;
        return;
      }
    } catch {}

    if (!remainingDepth) return;
    eachCandidate(value, candidate => walk(candidate, remainingDepth - 1));
  };

  for (const id in wpRequire.c) {
    const mod = wpRequire.c[id]?.exports;
    if (!mod) continue;

    walk(mod, depth);
    if (found) return found;
  }
};

const ws = new WebSocket('ws://127.0.0.1:1337'); // connect to arRPC bridge websocket
ws.onmessage = async x => {
  const msg = JSON.parse(x.data);

  try {
    if (!Dispatcher) {
      const wpRequire = getWebpackRequire();

      Dispatcher = findInCache(wpRequire, candidate =>
        candidate &&
        typeof candidate.dispatch === 'function' &&
        typeof candidate.subscribe === 'function'
      );

      const assetMod = findModule(wpRequire, 'getAssetImage: size must === [');
      eachCandidate(assetMod, candidate => {
        if (!lookupAsset && typeof candidate === 'function') {
          const str = candidate.toString();
          if (str.includes('APPLICATION_ASSETS_FETCH_SUCCESS') &&
            str.includes('startsWith("http:")')) {
            lookupAsset = async (appId, name) => (await candidate(appId, [ name ]))[0];
          }
        }
      });

      const appMod = findModule(wpRequire, 'Invalid Origin', 'coverImage', '.application');
      eachCandidate(appMod, candidate => {
        if (!lookupApp && typeof candidate === 'function') {
          const str = candidate.toString();
          if (str.includes('Invalid Origin') &&
            str.includes('coverImage') &&
            str.includes('.application')) {
            lookupApp = async appId => {
              const socket = {};
              await candidate(socket, appId);
              return socket.application;
            };
          }
        }
      });

      if (!Dispatcher || !lookupAsset || !lookupApp) {
        throw new Error(`Failed to find Discord internals for arRPC bridge (${[
          !Dispatcher && 'Dispatcher',
          !lookupAsset && 'lookupAsset',
          !lookupApp && 'lookupApp'
        ].filter(Boolean).join(', ')})`);
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
  } catch (err) {
    console.error('[arRPC bridge mod] Failed to handle message', err);
  }
};
})();
