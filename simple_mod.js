await import('https://rawcdn.githack.com/GooseMod/defiant/4fe79bcbab94d6185467382df03ecf6e528234dc/index.js'); // run defiant
const Webpack = await import('https://raw.githack.com/GooseMod/GooseMod/master/src/util/discord/webpackModules.js'); // load GM's Webpack

const ws = new WebSocket('ws://localhost:1337'); // connect to arRPC bridge
ws.onmessage = x => {
  msg = JSON.parse(x.data);
  console.log(msg);

  Webpack.common.FluxDispatcher.dispatch({ type: "LOCAL_ACTIVITY_UPDATE", ...msg }); // set RPC status
};