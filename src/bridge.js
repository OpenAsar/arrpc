import { WebSocketServer } from 'ws';

// basic bridge to pass info onto webapp
export const send = msg => {
  wss.clients.forEach(x => x.send(JSON.stringify(msg)));
};

const wss = new WebSocketServer({ port: 1337 });