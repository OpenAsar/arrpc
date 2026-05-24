import { readdir, readFile, readlink } from "fs/promises";

const CONCURRENCY_LIMIT = 100;

/** Limit concurrent operations to avoid resource exhaustion. */
async function mapLimit(items, limit, fn) {
  const res = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      res[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return res;
}

/** Create a getProcesses function with injectable filesystem. */
export function createGetProcesses(fs = { readdir, readFile, readlink }) {
  async function getProcessInfo(pid) {
    try {
      let exe = "";
      const cmdline = await fs.readFile(`/proc/${pid}/cmdline`, "utf8");
      const parts = cmdline.split("\0").filter(Boolean);

      if (parts.length > 0) {
        exe = parts[0];
      } else {
        // Fallback to comm if cmdline is empty (kernel threads)
        try {
          exe = (await fs.readFile(`/proc/${pid}/comm`, "utf8")).trim();
        } catch (e) {
          return null;
        }
      }

      let cwd = "";
      try {
        cwd = await fs.readlink(`/proc/${pid}/cwd`);
      } catch (err) {
        // Expected for processes without accessible cwd
      }

      return { pid: +pid, exe, args: parts.slice(1), cwd };
    } catch (err) {
      // Ignore ENOENT (process exited); log unexpected errors
      if (err.code !== "ENOENT" && process.env.ARRPC_DEBUG) {
        console.error(`[process/${pid}]`, err.code || err.message);
      }
      return null;
    }
  }

  return async () => {
    const entries = await fs.readdir("/proc");
    const pids = entries.filter((name) => /^\d+$/.test(name)).map(Number);

    const results = await mapLimit(pids, CONCURRENCY_LIMIT, getProcessInfo);
    return results.filter(Boolean);
  };
}

export const getProcesses = createGetProcesses();
