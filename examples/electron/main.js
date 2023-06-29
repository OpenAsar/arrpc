// myWindow = your discord.com BrowserWindow

import Server from './path/to/arrpc/server.js';

const arrpc = await new Server();
arrpc.on('activity', data => myWindow.webContents.send('rpc', data));
arrpc.on('invite', (code, callback) => {
  // your invite code handling here
  // callback(true) // Reply back to tell the client whether the invite is valid or not 
});