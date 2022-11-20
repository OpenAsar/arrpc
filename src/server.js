const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(87, 242, 135, 'bridge')}]`, ...args);

import { EventEmitter } from 'events';

import IPCServer from "./transports/ipc.js";
import WSServer from "./transports/websocket.js";


export default class RPCServer extends EventEmitter {
  constructor() { super(); return (async () => {
    this.onConnection = this.onConnection.bind(this);
    this.onMessage = this.onMessage.bind(this);

    const handlers = {
      connection: this.onConnection,
      message: this.onMessage
    };

    this.ipc = await new IPCServer(handlers);
    this.ws = await new WSServer(handlers);

    return this;
  })(); }

  onConnection(socket) {
    socket.send({
      cmd: 'DISPATCH',
      evt: 'READY',

      data: {
        v: 1
      }
    });

    this.emit('connection', socket);
  }

  async onMessage(socket, { cmd, args, nonce }) {
    this.emit('message', { socket, cmd, args, nonce });

    switch (cmd) {
      case 'SET_ACTIVITY':
        if (!socket.application) { // fetch info about application
          socket.application = await (await fetch(`https://discord.com/api/v9/oauth2/applications/${socket.clientId}/rpc`)).json();
          socket.application.assets = await (await fetch(`https://discord.com/api/v9/oauth2/applications/${socket.clientId}/assets`)).json();
          log('fetched app info for', socket.clientId, socket.application);
        }

        const { activity, pid } = args; // translate given parameters into what discord dispatch expects
        const { buttons, timestamps, instance } = activity;

        const metadata = {};
        const extra = {};
        if (buttons) { // map buttons into expected metadata
          metadata.button_urls = buttons.map(x => x.url);
          extra.buttons = buttons.map(x => x.label);
        }

        if (timestamps) for (const x in timestamps) { // translate s -> ms timestamps
          if (Date.now().toString().length - timestamps[x].toString().length > 2) timestamps[x] = Math.floor(1000 * timestamps[x]);
        }

        this.emit('activity', {
          activity: {
            name: socket.application.name,
            application_id: socket.application.id,
            type: 0,
            metadata,
            flags: instance ? (1 << 0) : 0,
            ...activity,
            ...extra
          },
          pid
        });

        break;

      case 'GUILD_TEMPLATE_BROWSER':
      case 'INVITE_BROWSER':
        const { code } = args;
        socket.send({
          cmd,
          data: {
            code
          },
          nonce
        });

        this.emit(cmd === 'INVITE_BROWSER' ? 'invite' : 'guild_template', code);
        break;

      case 'DEEP_LINK':
        this.emit('link', args.params);
        break;
    }
  }
}