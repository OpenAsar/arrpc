import test from "node:test";
import assert from "node:assert/strict";
import { createGetProcesses } from "../../src/process/native/linux.js";

test("parses cmdline and cwd correctly", async () => {
  const fakeFS = {
    async readdir() {
      return ["123"];
    },
    async readFile() {
      return "game\0--foo\0";
    },
    async readlink() {
      return "/home/user/Games";
    },
  };

  const getProcesses = createGetProcesses(fakeFS);
  const rows = await getProcesses();

  assert.equal(rows[0].pid, 123);
  assert.equal(rows[0].exe, "game");
});
