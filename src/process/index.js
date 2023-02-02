const path = require('path');
const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}]`, ...args);

var DetectableDB = require(path.join(__dirname, "../process/detectable.json"));

const Native = require(path.join(__dirname, '../process/native/index.js'));

const timestamps = {}, names = {}, pids = {};
class ProcessServer {
  constructor(handlers) {
    if (!Native) return; // log('unsupported platform:', process.platform);

    this.handlers = handlers;

    this.scan = this.scan.bind(this);

    this.scan();
    setInterval(this.scan, 5000);

    log('started');
	//console.log('started');
  }

  async scan() {
    const processes = await Native;
	//console.log(processes)
    var ids = [];
/*  	var names = [];
	var pids = [];
	var timestamps = [];  */

    for (const process of processes) {
      const path = process.path.toLowerCase().replaceAll('\\', '/');
      const toCompare = [ path.split('/').pop(), path ];
		//console.log(toCompare);
		
      for (const p of toCompare.slice()) { // add more possible tweaked paths for less false negatives
        toCompare.push(p.replace('64', '')); // remove 64bit identifiers-ish
        toCompare.push(p.replace('.x64', ''));
        toCompare.push(p.replace('x64', ''));
      }

      for (const app of DetectableDB) { //{ executables, id, name }
        if (app.executables?.some(x => !x.isLauncher && toCompare.some(y => x.name === y))) {
			//names.push(app.name);
          names[app.id] = app.name;
          pids[app.id] = process.pid;

          ids.push(app.id);
		  console.log(ids)
          if (!timestamps[app.id]) {
            log('detected game!', app.name);
			//console.log('detected game!', name);
            timestamps[app.id] = Date.now();

            this.handlers.message({
              socketId: app.id
            }, {
              cmd: 'SET_ACTIVITY',
              args: {
                activity: {
                  application_id: app.id,
                  name: app.name,
                  timestamps: {
                    start: timestamps[app.id]
                  }
                },
                pid
              }
            });
          }
        }
      }
    }

    for (const id in timestamps) {
      if (!ids.includes(id)) {
        log('lost game!', names[id]);
		//console.log('lost game!', names[id]);
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
  }
}

module.exports = ProcessServer