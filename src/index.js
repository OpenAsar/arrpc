const path = require('path');
const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')}]`, ...args);

log('arRPC v3.0.0 [experimental]');
//console.log('arRPC v3.0.0 [experimental]');

var Bridge = require(path.join(__dirname, '../src/bridge.js'));
var RPCServer = require(path.join(__dirname, '../src/server.js'));

async function start() {
	//log(RPCServer)
	const server = await new RPCServer();
	server.on('activity', data => Bridge.send(data));
}

start()