const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(237, 66, 69, 'process')}]`, ...args);

import fs from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import DetectableDBTemp from "./detectable.json" with { type: "json" };
DetectableDBTemp.push({
  aliases: ["Obs"],
  executables: [
    { is_launcher: false, name: "obs", os: "linux" },
    { is_launcher: false, name: "obs.exe", os: "win32" },
    { is_launcher: false, name: "obs.app", os: "darwin" },
  ],
  hook: true,
  id: "STREAMERMODE",
  name: "OBS",
});

// Reminder: executable names must be stored as lowercase as they are converted to such before matching against the database
const extraExecutablesById = new Map([
  [
    "356943187589201930",
    [{ is_launcher: false, name: "dolphin-emu", os: "linux" }],
  ],
  [
    "1257819671114289184",
    [{ is_launcher: false, name: "ZenlessZoneZero.exe", os: "win32" }],
  ],
  [
    "451540911172747284",
    [{ is_launcher: false, name: "bms_linux", os: "linux" }],
  ],
  [
    "1158877933042143272",
    [{ is_launcher: false, name: "linuxsteamrt64/cs2", os: "linux" }],
  ],
  [
    "1440129553036083341",
    [{ is_launcher: false, name: "soulframe.x64.exe", os: "win32" }],
  ]
]);

for (const entry of DetectableDBTemp) {
  const extras = extraExecutablesById.get(entry.id);
  if (extras) entry.executables.push(...extras);
}
const DetectableDB = DetectableDBTemp;

import * as Natives from "./native/index.js";
// eslint-disable-next-line no-undef
const Native = Natives[process.platform];

const IGNORE_RULES = {
  linux: [
    /^\/proc\//,
    /k(worker|softirq)/, // Linux kernel worker threads
    /^\/(usr|)\/(bin|sbin|lib)\/(?!(dolphin-emu|obs))/,
    /\/crashpad_handler$/,
    /webhelper/,
    /^\/tmp\//,
    /(\/bin\/|)dolphin$/, // KDE, not emulator
  ],
  win32: [
    /^C:\\Windows/i,
    (path) => path.includes("\\") && !path.includes("/"), // pure win path
  ],
};

/** Check our rules to determine if a process should be ignored **/
export function shouldIgnoreProcess(path, os) {
  const rules = IGNORE_RULES[os] || [];
  return rules.some((rule) =>
    typeof rule === "function" ? rule(path) : rule.test(path),
  );
}

// ------------------------ Refactor helpers -------------------------------
/** Normalize a filesystem path for comparisons. */
const normPath = (p = "") => String(p).toLowerCase().replaceAll("\\", "/");

/** Strip common 64-bit suffixes from executable names. */
const stripBitness = (s = "") => {
  const bitness_suffixes = [".x86_64", ".x64", "_64", "64"];
  for (const suf of bitness_suffixes) {
    if (s.endsWith(suf)) return s.slice(0, -suf.length);
  }
  return s;
};

/**
 * Build a compact set of candidates we will try to match against the DB.
 * Examples returned: ['eldenring.exe', 'eldenring', 'steamapps/common/eldenring.exe']
 */
const buildCandidates = (rawPath, cwdPath) => {
  const out = new Set();
  const p = normPath(rawPath);

  // Drop CLI args if present (e.g., "C:/Games/foo/bar.exe --flag ...")
  const noArgs = p.includes(" --") ? p.split(" --")[0] : p;
  const base = noArgs.slice(noArgs.lastIndexOf("/") + 1);

  out.add(stripBitness(base));

  // For Windows-style exe paths, include the last 2 segments to catch DB entries
  // We also need to match Linux Native executables, since we swap the suffix later for comparison
  if (noArgs.includes(".exe") || noArgs.includes(".x86_64")) {
    const last2 = noArgs.split("/").slice(-2).join("/");
    out.add(stripBitness(last2));
  }

  // Also include a cwd-anchored variant to help path.includes matches
  if (cwdPath) out.add(`${normPath(cwdPath)}/${stripBitness(base)}`);

  // Add exe-less variant if present
  if (base.endsWith(".exe")) out.add(base.replace(/\.exe$/, ""));

  return Array.from(out);
};

/**
 * Decide whether a known executable entry matches the running process.
 * Mirrors legacy behavior but is easier to read & extend.
 */
const matchesKnownExe = (known, candidates, cwdPath, argsStr) => {
  if (!known || known.is_launcher) return false;
  const kname = known.name || "";
  const needsArgs = Boolean(known.arguments);
  const hasReqArgs =
    !needsArgs || (argsStr && argsStr.includes(known.arguments));

  // Special '>' syntax: require exact match to the first candidate
  if (kname[0] === ">") {
    return candidates[0] === kname.slice(1) && hasReqArgs;
  }

  // Try direct name and common variants across all candidates
  for (const cand of candidates) {
    const running = cand;
    if (kname === running) return hasReqArgs;
    if (kname === `${running}.exe`) return hasReqArgs;
    if (kname === running.replace(/\.exe$/, "")) return hasReqArgs;
    if (String(running).includes(`/${kname}`)) return hasReqArgs; // handles cwd + filename
    if (kname === running.replace(/\.x86_64$/, ".exe")) return hasReqArgs;
  }

  // Last resort: allow arg-only matches (previous behavior)
  return needsArgs && hasReqArgs;
};
// -------------------------------------------------------------------------

const timestamps = {}, names = {}, pids = {};
export default class ProcessServer {
  constructor(handlers) {
    if (!Native) return; // log('unsupported platform:', process.platform);

    this.handlers = handlers;

    this.scan = this.scan.bind(this);

    this.scan();
    setInterval(this.scan, 5000);

    log('started');
  }

  async scan() {
    // const startTime = performance.now();
    const processes = await Native.getProcesses();
    const ids = [];

    // log(`got processed in ${(performance.now() - startTime).toFixed(2)}ms`);

    // TODO: Make sure this works on windows (see in src/process/win32.js)
    for (const { pid, exe: _path, args, cwd: _cwdPath = "" } of processes) {
      if (shouldIgnoreProcess(_path, process.platform)) continue;
      const argsStr = Array.isArray(args) ? args.join(" ") : "";
      const path = _path.toLowerCase().replaceAll("\\", "/");
      const cwdPath = _cwdPath.toLowerCase().replaceAll("\\", "/");
      const toCompare = buildCandidates(path, cwdPath);

      for (const { executables, id, name } of DetectableDB) {
        if (!executables || !Array.isArray(executables)) continue;

        const matched = executables.some((k) =>
          matchesKnownExe(k, toCompare, cwdPath, argsStr),
        );
        if (!matched) continue;
        {
          names[id] = name;
          pids[id] = pid;

          ids.push(id);
          if (!timestamps[id]) {
            log('detected game!', name);
            timestamps[id] = Date.now();
          }

          // Resending this on every scan is intentional, so that in the case that arRPC scans processes before Discord, existing activities will be sent
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
