import { readdir, readFile, readlink } from "fs/promises";

export const getProcesses = async () => (await Promise.all(
  (await readdir("/proc")).map(pid =>
    (+pid > 0) && readFile(`/proc/${pid}/cmdline`, 'utf8')
      .then(async path => {
        let cwdPath;
        try {
          cwdPath = await readlink(`/proc/${pid}/cwd`);
        } catch (err) {};
        return [+pid, path.split("\0")[0], path.split("\0").slice(1), cwdPath]
      }, () => 0)
  )
)).filter(x => x);