import { readdir, readFile } from "fs/promises";

export const getProcesses = async (currentProcs) => {
  let pids = (await readdir("/proc")).filter((f) => !isNaN(+f));
  let updatedProcs = currentProcs.filter((item) => pids.includes(item[0]));
  let updatedPids = pids.filter(
    (item) => !updatedProcs.map((item) => item[0]).includes(item)
  );
  let processes = (
    await Promise.all(
      updatedPids.map((pid) =>
        readFile(`/proc/${pid}/cmdline`, "utf8").then(
          (path) => [pid, path.replace(/\0/g, "")],
          () => {}
        )
      )
    )
  ).filter((x) => x);
  let adjustedList = [...processes, ...updatedProcs];
  return adjustedList;
};
