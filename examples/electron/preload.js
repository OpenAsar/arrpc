import { ipcRenderer } from 'electron';

let Dispatcher;
ipcRenderer.on('rpc', (event, data) => {
  if (!Dispatcher) {
    const cache = window.webpackChunkdiscord_app.push([[ Symbol() ], {}, x => x]).c;
    window.webpackChunkdiscord_app.pop();

    for (const id in cache) {
      let mod = cache[id].exports;
      mod = mod && (mod.Z ?? mod.ZP);

      if (mod && mod.register && mod.wait) {
        Dispatcher = mod;
        break;
      }
    }
  }

  Dispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...data }); // set RPC status
});