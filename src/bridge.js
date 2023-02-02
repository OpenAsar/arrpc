const path = require('path');

const port = 1337;
const { WebSocketServer, WebSocket } = require('ws');
const wss = new WebSocketServer({port: port});

const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(87, 242, 135, 'bridge')}]`, ...args);


// basic bridge to pass info onto webapp
let lastMsg = {};
const send = msg => {
  lastMsg[msg.socketId] = msg;
  wss.clients.forEach(x => x.send(JSON.stringify(msg)));
};

wss.on('connection', socket => {
  log('web connected');
  //console.log('web connected');

  for (const id in lastMsg) { // catch up newly connected
    if (lastMsg[id].activity != null) send(lastMsg[id]);
  }

  socket.on('close', () => {
    log('web disconnected');
	//console.log('web disconnected');
  });
});

wss.on('listening', () => log('listening on', port)); //&& console.log('listening on', port));