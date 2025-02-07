const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}]`, ...args);

import fs from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const databasePath = join(__dirname, 'detectable.json');

async function getDatabase(lastModified) {
  const options = {
    hostname: 'discord.com',
    path: '/api/v9/applications/detectable',
    headers: lastModified ? { 'If-Modified-Since': lastModified } : {}
  }
  return new Promise((resolve, reject) => {
    get(options, res => {
      if (res.statusCode === 304) return resolve(false); 
      if (res.statusCode !== 200) return reject(new Error(`http code ${res.statusCode}`));

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('error', (error) => reject(new Error(`error in data stream: ${error}`))); // abort without writing data 
      res.on('end', () =>  {
        try {
          fs.writeFileSync(databasePath, JSON.stringify(JSON.parse(data)), 'utf8');
          resolve(true);
        } catch (err) {
          reject(new Error(`failed retrieving the database: ${err}`));
        }
      });
    });
  });
};

import * as Natives from './native/index.js';
const Native = Natives[process.platform];

const timestamps = {}, names = {}, pids = {};
export default class ProcessServer {
  constructor(handlers) {
    if (!Native) return; // log('unsupported platform:', process.platform);

    this.handlers = handlers;
    this.DetectableDB = null;

    this.scan = this.scan.bind(this);
    this.initializeDatabase().then(() => {
      this.scan();
      setInterval(this.scan, 5000);
      log('started');
    });
  }

  async initializeDatabase() {
    log("initializing database")
    let age;
    try { age = fs.statSync(databasePath).mtime.toUTCString() } 
    catch { age = null }
  
    await getDatabase(age)
      .then(updated => {
        if (updated) log('database updated successfully')
      })
      .catch(error => {log(`${error}.. continuing with old database`)});
    
    try {
      this.DetectableDB = JSON.parse(fs.readFileSync(databasePath));
    } catch (err) {
      try { fs.unlinkSync(databasePath) } catch {} // try to detele in case the json is invalid
      throw new Error(`could not load the database. aborting... ${err}`)
    }
  }

  async scan() {
    // const startTime = performance.now();
    const processes = await Native.getProcesses();
    const ids = [];

    // log(`got processed in ${(performance.now() - startTime).toFixed(2)}ms`);

    for (const [ pid, _path, args ] of processes) {
      const path = _path.toLowerCase().replaceAll('\\', '/');
      const toCompare = [];
      const splitPath = path.split('/');
      for (let i = 1; i < splitPath.length; i++) {
        toCompare.push(splitPath.slice(-i).join('/'));
      }

      for (const p of toCompare.slice()) { // add more possible tweaked paths for less false negatives
        toCompare.push(p.replace('64', '')); // remove 64bit identifiers-ish
        toCompare.push(p.replace('.x64', ''));
        toCompare.push(p.replace('x64', ''));
        toCompare.push(p.replace('_64', ''));
      }

      for (const { executables, id, name } of this.DetectableDB) {
        if (executables?.some(x => {
          if (x.is_launcher) return false;
          if (x.name[0] === '>' ? x.name.substring(1) !== toCompare[0] : !toCompare.some(y => x.name === y)) return false;
          if (args && x.arguments) return args.join(" ").indexOf(x.arguments) > -1;
          return true;
        })) {
          names[id] = name;
          pids[id] = pid;

          ids.push(id);
          if (!timestamps[id]) {
            log('detected game!', name);
            timestamps[id] = Date.now();
          }

          // Resending this on evry scan is intentional, so that in the case that arRPC scans processes before Discord, existing activities will be sent
          this.handlers.message({
            socketId: id
          }, {
            cmd: 'SET_ACTIVITY',
            args: {
              activity: {
                application_id: id,
                name,
                timestamps: {
                  start: timestamps[id]
                }
              },
              pid
            }
          });
        }
      }
    }

    for (const id in timestamps) {
      if (!ids.includes(id)) {
        log('lost game!', names[id]);
        delete timestamps[id];

        this.handlers.message({
          socketId: id
        }, {
          cmd: 'SET_ACTIVITY',
          args: {
            activity: null,
            pid: pids[id]
          }
        });
      }
    }

    // log(`finished scan in ${(performance.now() - startTime).toFixed(2)}ms`);
    // process.stdout.write(`\r${' '.repeat(100)}\r[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}] scanned (took ${(performance.now() - startTime).toFixed(2)}ms)`);
  }
}
