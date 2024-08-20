const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(87, 242, 135, 'bridge')}]`, ...args);

import { EventEmitter } from 'events';

import IPCServer from './transports/ipc.js';
import WSServer from './transports/websocket.js';
import ProcessServer from './process/index.js';

let socketId = 0;
export default class RPCServer extends EventEmitter {
  constructor() { super(); return (async () => {
    this.onConnection = this.onConnection.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onClose = this.onClose.bind(this);

    const handlers = {
      connection: this.onConnection,
      message: this.onMessage,
      close: this.onClose
    };

    this.ipc = await new IPCServer(handlers);
    this.ws = await new WSServer(handlers);

    if (!process.argv.includes('--no-process-scanning') && !process.env.ARRPC_NO_PROCESS_SCANNING) this.process = await new ProcessServer(handlers);

    return this;
  })(); }

  onConnection(socket) {
    socket.send({
      cmd: 'DISPATCH',
      data: {
        v: 1,
        config: {
          cdn_host: 'cdn.discordapp.com',
          api_endpoint: '//discord.com/api',
          environment: 'production'
        },
        user: { // mock user data using arRPC app/bot
          id: '1045800378228281345',
          username: 'arrpc',
          discriminator: '0',
          global_name: 'arRPC',
          avatar: 'cfefa4d9839fb4bdf030f91c2a13e95c',
          avatar_decoration_data: null,
          bot: false,
          flags: 0,
          premium_type: 0,
        }
      },
      evt: 'READY',
      nonce: null
    });

    socket.socketId = socketId++;

    this.emit('connection', socket);
  }

  onClose(socket) {
    this.emit('activity', {
      activity: null,
      pid: socket.lastPid,
      socketId: socket.socketId.toString()
    });

    this.emit('close', socket);
  }

  async onMessage(socket, { cmd, args, nonce }) {
    this.emit('message', { socket, cmd, args, nonce });

    switch (cmd) {
      case "CONNECTIONS_CALLBACK":
        // If it works - it works
        socket.send?.({
          cmd,
          data: {
            code: 1000
          },
          evt: 'ERROR',
          nonce
        });
        break;

      case 'SET_ACTIVITY':
        const { activity, pid } = args; // translate given parameters into what discord dispatch expects

        if (!activity) {
          // Activity clear
          socket.send?.({
            cmd,
            data: null,
            evt: null,
            nonce
          });

          return this.emit('activity', {
            activity: null,
            pid,
            socketId: socket.socketId.toString()
          });
        }

        const { buttons, timestamps, instance } = activity;

        socket.lastPid = pid ?? socket.lastPid;

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
            application_id: socket.clientId,
            type: 0,
            metadata,
            flags: instance ? (1 << 0) : 0,
            ...activity,
            ...extra
          },
          pid,
          socketId: socket.socketId.toString()
        });

        socket.send?.({
          cmd,
          data: {
            ...activity,
            name: "",
            application_id: socket.clientId,
            type: 0
          },
          evt: null,
          nonce
        });

        break;

      case 'GUILD_TEMPLATE_BROWSER':
      case 'INVITE_BROWSER':
        const { code } = args;

        const isInvite = cmd === 'INVITE_BROWSER';
        const callback = (isValid = true) => {
          socket.send({
            cmd,
            data: isValid ? { code } : {
              code: isInvite ? 4011 : 4017,
              message: `Invalid ${isInvite ? 'invite' : 'guild template'} id: ${code}`
            },
            evt: isValid ? null : 'ERROR',
            nonce
          });
        }

        this.emit(isInvite ? 'invite' : 'guild-template', code, callback);
        break;

      case 'DEEP_LINK':
        this.emit('link', args.params);
        break;
    }
  }
}
