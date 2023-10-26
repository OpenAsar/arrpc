// ==UserScript==
// @name         arRPC Client
// @namespace    https://github.com/OpenAsar
// @version      0.1
// @description  Userscript Client for arRPC with Discord Web
// @author       OpenAsar
// @match        https://*.discord.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

// https://github.com/OpenAsar/arrpc/blob/main/examples/bridge_mod.js
(() => {
let Dispatcher, lookupAsset, lookupApp, apps = {};
const apiBase = window.GLOBAL_ENV.API_ENDPOINT + '/v' + window.GLOBAL_ENV.API_VERSION;
// also only one letter function name, one letter arg name
const asyncWithTwoArgsRegex = /^async\s+function\s.\(\s*\w+\s*,\s*\w+\s*\)/;

const ws = new WebSocket('ws://127.0.0.1:1337'); // connect to arRPC bridge websocket
ws.onmessage = async x => {
  msg = JSON.parse(x.data);
  console.log(msg);

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

        const _lookupAsset = Object.values(mod).find(e => typeof e === "function" &&
                                                     // two heuristics to detect fetchAssetIds
                                                    (e.toString().includes("APPLICATION_ASSETS_FETCH_SUCCESS")
                                                    || asyncWithTwoArgsRegex.test(e.toString())
                                                    )
        );
        lookupAsset = async (appId, name) => (await _lookupAsset(appId, [ name, undefined ]))[0];

        break;
      }
    }

    lookupApp = async appId => {
      const res = await fetch(`${apiBase}/oauth2/applications/${appId}/rpc`);
      return res.json();
    }
  }

  if (msg.activity?.assets?.large_image) msg.activity.assets.large_image = await lookupAsset(msg.activity.application_id, msg.activity.assets.large_image);
  if (msg.activity?.assets?.small_image) msg.activity.assets.small_image = await lookupAsset(msg.activity.application_id, msg.activity.assets.small_image);

  // prevent errors when activity is null and let activity stop
  if(msg.activity) {
    const appId = msg.activity.application_id;
    if (!apps[appId]) apps[appId] = await lookupApp(appId);

    const app = apps[appId];
    if (!msg.activity.name) msg.activity.name = app.name;
  }

  Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg }); // set RPC status
};
})();

