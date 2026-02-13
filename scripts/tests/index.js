#!/usr/bin/env node

import { glob } from "node:fs";
import { promisify } from "node:util";

const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) =>
  console.log(
    `[${rgb(88, 101, 242, "arRPC")} > ${rgb(255, 165, 0, "tests")}]`,
    ...args,
  );

const globAsync = promisify(glob);

log("Running test suite...\n");

const testFiles = await globAsync(
  new URL("./**.test.js", import.meta.url).pathname,
);

for (const testFile of testFiles) {
  await import(testFile);
}

log("\nTest suite completed");
