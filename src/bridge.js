const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(87, 242, 135, 'bridge')}]`, ...args);

import { WebSocket, WebSocketServer } from 'ws';
import { sendToBridgeClients } from './bridge-clients.js';
import { createBridgeState } from './bridge-state.js';

// basic bridge to pass info onto webapp
const state = createBridgeState();
export const send = msg => {
  state.update(msg);
  sendToBridgeClients(wss.clients, msg, { openState: WebSocket.OPEN });
};

let port = 1337;
if (process.env.ARRPC_BRIDGE_PORT) {
  port = parseInt(process.env.ARRPC_BRIDGE_PORT);
  if (isNaN(port)) {
    throw new Error('invalid port');
  }
}
const wss = new WebSocketServer({ port });

wss.on('connection', socket => {
  log('web connected');

  for (const msg of state.replayable()) { // catch up newly connected
    sendToBridgeClients([socket], msg, { openState: WebSocket.OPEN });
  }

  socket.on('close', () => {
    log('web disconnected');
  });
});

wss.on('listening', () => log('listening on', port));
