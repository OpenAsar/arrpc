import test from "node:test";
import assert from "node:assert/strict";
import { shouldIgnoreProcess } from "../../src/process/index.js";

const ignores = {
  linux: [
    "/proc/123/exe",
    // Important: don't confuse KDE file manager with Dolphin emulator (dolphin-emu)
    "/usr/bin/dolphin",
  ],
  win32: [
    "C:\\Windows\\system32\\winedevice.exe",
    "C:\\Windows\\System32\\wdhoersvc.exe",
  ],
};

const keeps = {
  // Linux-native binaries (Steam/others)
  linux: [
    "/home/user/.local/share/Steam/steamapps/common/7 Days To Die/7DaysToDie.x86_64",
    "/home/user/.local/share/Steam/steamapps/common/Hollow Knight/hollow_knight.x86_64",
    "/home/user/.local/share/Steam/steamapps/common/Valheim/valheim.x86_64",
    "/home/user/.local/share/Steam/steamapps/common/X4 Foundations/testandlaunch",
    "/home/user/.local/share/Steam/steamapps/common/Factorio/bin/x64/factorio",
    // Wrapper binary (no path)
    "hytale-launcher-wrapper",
    "/usr/bin/dolphin-emu",
    "/usr/bin/obs",
    "obs", // flatpak
  ],
  // Windows executables launched via Wine/Proton/Lutris (paths live on Linux FS, but "platform" is win32)
  win32: [
    "/home/user/.local/share/Steam/steamapps/common/7 Days To Die/7dLauncher.exe",
    "/home/user/.local/share/Steam/steamapps/common/Hollow Knight/hollow_knight.exe",
    "/home/user/.local/share/Steam/steamapps/common/Valheim/valheim.exe",
    "/home/user/.local/share/Steam/steamapps/common/X4 Foundations/X4.exe",
    "/home/user/.local/share/Steam/steamapps/common/Factorio/bin/x64/factorio.exe",
    "/home/user/.local/share/Steam/steamapps/common/FINAL FANTASY XIV Online/game/ffxiv_dx11.exe",
    "/home/user/.local/share/Steam/steamapps/common/Wuthering Waves/Wuthering Waves.exe",
    "/home/user/Games/Lutris/arknights-endfield/drive_c/Program Files/GRYPHLINK/games/EndField Game/Endfield.exe",
    "ZenlessZoneZero.exe",
    "obs.exe",
  ],
};

Object.entries(ignores).forEach(([os, paths]) => {
  paths.forEach((path) => {
    test(`ignores (${os}): ${path}`, () => {
      assert.equal(shouldIgnoreProcess(path, os), true);
    });
  });
});

Object.entries(keeps).forEach(([os, paths]) => {
  paths.forEach((path) => {
    test(`keeps (${os}): ${path}`, () => {
      assert.equal(shouldIgnoreProcess(path, os), false);
    });
  });
});
