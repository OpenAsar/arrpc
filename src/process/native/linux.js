import { readdir, readFile } from "fs/promises";

export const getProcesses = async () => (await Promise.all(
  (await readdir("/proc")).map(pid =>
    (+pid > 0) && readFile(`/proc/${pid}/cmdline`, 'utf8')
      .then(async path => {
        try {
          const status = await readFile(`/proc/${pid}/status`, 'utf8');
          if (status.includes('State:\tT')) {
            return null;
          }
        }
        catch (err) {};
        return [+pid, path.split("\0")[0], path.split("\0").slice(1)]
      }, () => 0)
  )
)).filter(x => x);
