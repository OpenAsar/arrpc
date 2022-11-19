import { WebSocketServer } from 'ws';

export const send = msg => {
  wss.clients.forEach(x => x.send(JSON.stringify(msg)));
};

const wss = new WebSocketServer({ port: 1337 });