import { readdir, readlink } from 'fs/promises';

export const getProcesses = async () => {
  const pids = (await readdir("/proc")).filter((f) => !isNaN(+f));
  return (await Promise.all(pids.map((pid) =>
    readlink(`/proc/${pid}/exe`).then((path) => [+pid, path], () => {})
  ))).filter(x => x);
}
