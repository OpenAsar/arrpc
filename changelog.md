# arRPC Changelog

## v3.4.0 [28-04-2024]
- Linux process detection is now improved, thanks to [Sqaaakoi](https://github.com/Sqaaakoi). ([#75](https://github.com/OpenAsar/arrpc/pull/75))
- Rewrote ready packet sent to applications so potential regressions from v3.3.1 should be fixed.
- Rewrote detectable DB loading to work with Node v22.
- Removed top-level await so older runtimes should no longer crash.

## v3.3.1 [13-02-2024]
- Fixed a bug crashing some RPC libraries.

## v3.3.0 [19-01-2024]
- **Rewrote Linux game detection.** It should be more reliable and optimized now. Thanks to @rniii and @0xk1f0 for PRs.
- **Fixed bug which broke a community Rust SDK.**
- **Updated game database.**

## v3.2.0 [13-08-2023]
- **Added callback to invite events API.**
- **Updated detectable database with latest from Discord.**
- **Fixed some libraries not working due to not calling back on activity clear.**
- **Fixed refusing connections from Canary web.**
- **Disabled most logging by default.**

## v3.1.0 [02-02-2023]
- **Added Linux process scanning.** Now scans for detectable Linux games on Linux too.

## v3.0.0 [26-11-2022]
- **Added Process Scanning.** Now scans for detectable/verified games and tells Discord the app, allowing process detection whilst maintaining privacy (Discord does not see any/all processes, just the name and app ID).
- **Fixed RPC not fully working with more apps/libraries.** Now responds with a mock/fake arRPC user and the proper config, replies with confirmation, and supports blank activites fully.
- **Fixed a few minor Bridge bugs.** Fixed catchup not working with several apps.

## v2.2.1 [24-11-2022]
- IPC: Fix version given as string not being accepted
- IPC: Fix socket closing

## v2.2.0 [20-11-2022]
- Server: Move all looking up/fetching to client

## v2.1.0 [20-11-2022]
- Server: Stop activites when app disconnects
- Server: Added support for several apps shown at once (added `socketId`)
- Bridge: Catchup newly connected clients with last message by socket id
- Transports: Rewrote internal API to use handlers object
- API: Added parsing for GUILD_TEMPLATE_BROWSER
- API: Added parsing for DEEP_LINK

## v2.0.0 [20-11-2022]
- feat (breaking): moved asset lookup to client
- feat: add examples
- feat: add changelog