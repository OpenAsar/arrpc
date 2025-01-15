const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}]`, ...args);

import * as Natives from './native/index.js';
const Native = Natives[process.platform];

import { spawn, Worker } from "threads";

export default class ProcessServer {
  constructor(handlers) { return (async () => {
    if (!Native) return; // log('unsupported platform:', process.platform);

    const scanner = await spawn(new Worker("./scanner"))
    scanner.processes().subscribe(({ id, args }) => {
      handlers.message({
        socketId: id
      }, {
        cmd: 'SET_ACTIVITY',
        args
      });
    })

    setInterval(() => scanner.scan(), 5000);

    log('started');
    })(); }
}
