// NOTE: you may have to run this after onload
(() => {
let Dispatcher, lookupAsset, lookupApp, apps = {};

function getToken() {
  	let a = [];
  	webpackChunkdiscord_app.push([[0],,e=>Object.keys(e.c).find(t=>(t=e(t)?.default?.getToken?.())&&a.push(t))]);
  	return a[0];
   }

const token = getToken()

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

    for (const prop in mod) {
        const candidate = mod[prop];
        try {
            if (candidate && candidate.register && candidate.wait) {
                Dispatcher = candidate;
                break;
            }
        } catch {
            continue;
        }
    }

    if (Dispatcher) break;
}

   
    const factories = wpRequire.m;
    

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

async function lookupAsset(id, d) {
	const authHeaders = new Headers();
	authHeaders.append("Authorization", token);

	const uploadHeaders = new Headers();
	uploadHeaders.append("Authorization", token);
        uploadHeaders.append("content-type", "application/json");
	  
       const isUrl = string => {
      try { return Boolean(new URL(string)); }
      catch(e){ return false; }
  }
        if (isUrl(d)) {
	     const response_upload = await fetch("https://discord.com/api/v9/applications/" + id + "/external-assets", {
  		headers: uploadHeaders,
                method: "POST",
		body: JSON.stringify({ urls: [d] }),
	     });

	    data = await response_upload.json()
            return "mp:" + data[0]["external_asset_path"]


        }

	const response = await fetch("https://discord.com/api/v9/oauth2/applications/" + id + "/assets?nocache=true", {
  		headers: authHeaders,
	});
	
	data = await response.json()
        let trip = false
        let iid = ''
	
	for (let i in data) {
           let real = data[i]
           if (trip) {
             break
           }
           if (real["name"] == d) {
             trip = true
             iid = real["id"]
           }
        }
	return iid
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
