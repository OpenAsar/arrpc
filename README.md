# arRPC
arRPC is an open source implementation of Discord's half-documented local RPC servers for their desktop client. This open source implementation purely in NodeJS allows it to be used in many places where it is otherwise impossible to do: Discord web and alternative clients like Armcord/etc. It opens a simple bridge WebSocket server which messages the JSON of exactly what to dispatch with in the client with no extra processing needed, allowing small and simple mods or plugins. **It is currently in alpha and is very WIP, expect bugs, etc.**

### How to try
1. Clone repo
2. Run server with `node src` (use new Node)
2. Open Discord in browser with CSP disabled (using an extension)
3. Run content of [`simple_mod.js`](simple_mod.js) in console
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
- [ ] AUTHORIZE
- [ ] AUTHENTICATE
- [ ] GET_GUILD
- [ ] GET_GUILDS
- [ ] GET_CHANNEL
- [ ] GET_CHANNELS
- [ ] SUBSCRIBE
- [ ] UNSUBSCRIBE
- [ ] SET_USER_VOICE_SETTINGS
- [ ] SELECT_VOICE_CHANNEL
- [ ] GET_SELECTED_VOICE_CHANNEL
- [ ] SELECT_TEXT_CHANNEL
- [ ] GET_VOICE_SETTINGS
- [ ] SET_VOICE_SETTINGS
- [ ] SET_CERTIFIED_DEVICES
- [X] SET_ACTIVITY
- [ ] SEND_ACTIVITY_JOIN_INVITE
- [ ] CLOSE_ACTIVITY_REQUEST