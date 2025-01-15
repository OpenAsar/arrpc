const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}]`, ...args);

import { Observable, Subject } from 'threads/observable';
import { expose } from 'threads/worker';

let subject = new Subject();

import * as Natives from './native/index.js';
const Native = Natives[process.platform];

import fs from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DetectableDB = JSON.parse(fs.readFileSync(join(__dirname, 'detectable.json'), 'utf8'));

const timestamps = {},
  names = {},
  pids = {};

const scanner = {
  finish() {
    subject.complete();
    subject = new Subject();
  },
  async scan() {
    // const startTime = performance.now();
    const processes = await Native.getProcesses();
    const ids = [];

    // log(`got processed in ${(performance.now() - startTime).toFixed(2)}ms`);

    for (const [pid, _path, args] of processes) {
      const path = _path.toLowerCase().replaceAll('\\', '/');
      const toCompare = [];
      const splitPath = path.split('/');
      for (let i = 1; i < splitPath.length; i++) {
        toCompare.push(splitPath.slice(-i).join('/'));
      }

      for (const p of toCompare.slice()) {
        // add more possible tweaked paths for less false negatives
        toCompare.push(p.replace('64', '')); // remove 64bit identifiers-ish
        toCompare.push(p.replace('.x64', ''));
        toCompare.push(p.replace('x64', ''));
        toCompare.push(p.replace('_64', ''));
      }

      for (const { executables, id, name } of DetectableDB) {
        if (
          executables?.some((x) => {
            if (x.is_launcher) return false;
            if (
              x.name[0] === '>'
                ? x.name.substring(1) !== toCompare[0]
                : !toCompare.some((y) => x.name === y)
            )
              return false;
            if (args && x.arguments)
              return args.join(' ').indexOf(x.arguments) > -1;
            return true;
          })
        ) {
          names[id] = name;
          pids[id] = pid;

          ids.push(id);
          if (!timestamps[id]) {
            log('detected game!', name);
            timestamps[id] = Date.now();
          }

          // Resending this on every scan is intentional, so that in the case that arRPC scans processes before Discord, existing activities will be sent
          subject.next({
            id,
            args: {
              activity: {
                application_id: id,
                name,
                timestamps: {
                  start: timestamps[id],
                },
              },
              pid,
            },
          });
        }
      }
    }

    for (const id in timestamps) {
      if (!ids.includes(id)) {
        log('lost game!', names[id]);
        delete timestamps[id];

        subject.next({
          id,
          args: {
            activity: null,
            pid: pids[id],
          },
        });
      }
    }
  },
  processes() {
    return Observable.from(subject);
  },
};

expose(scanner);
