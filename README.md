# arRPC
arRPC is an open source implementation of Discord's half-documented local RPC servers for their desktop client. This open source implementation purely in NodeJS allows it to be used in many places where it is otherwise impossible to do: Discord web and alternative clients like Armcord/etc. It opens a simple bridge WebSocket server which messages the JSON of exactly what to dispatch with in the client with no extra processing needed, allowing small and simple mods or plugins. **It is currently in alpha and is very WIP, expect bugs, etc.**

<br>

Rich Presence (RPC) is the name for how some apps can talk to Discord desktop on your PC via localhost servers to display detailed info about the app's state. This usually works via parts of Discord desktop natively doing things + parts of Discord web interpreting that and setting it as your status. arRPC is an open source implementation of the local RPC servers on your PC, allowing apps to talk to it thinking it was just normal Discord. It can then send that info to apps which usually don't get RPC, like Discord Web, Armcord, etc. which can then set that as your status. This would otherwise not be possible, as web apps/browsers/etc can't just use Discord's already existing code and version.

- App with Discord RPC
- ~~Discord Desktop's native server~~ arRPC
- ~~Discord Web's setting~~ mod/plugin

<br>

### How to try
1. Clone repo
2. Run server with `node src` (use new Node)
2. Open Discord in browser (or any client wrapper)
3. Run content of [`examples/bridge_mod.js`](examples/bridge_mod.js) in Console
4. Use an app/thing with RPC
5. Hope it works, if not report bugs :)

## Supported

### Transports
- [X] WebSocket Server
  - [X] JSON
  - [ ] Erlpack
- [ ] HTTP Server
- [X] IPC

### Commands
- [X] DISPATCH
- [X] SET_ACTIVITY
- [X] INVITE_BROWSER