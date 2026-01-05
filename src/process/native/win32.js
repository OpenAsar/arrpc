import { exec } from 'child_process';

export const getProcesses = () =>
  new Promise(res =>
    exec(
      `wmic process get ProcessID,ExecutablePath,CommandLine /format:csv`,
      (e, out) => {
        res(
          out
            .toString()
            .split('\r\n')
            .slice(2)
            .map(x => {
              const parsed = x.trim().split(',').slice(1).reverse();
              return [
                parseInt(parsed[0]) || parsed[0],
                parsed[1],
                parsed[2] != undefined ? parsed[2].split(" ") : undefined
              ];
            })
            .filter(x => x[2])
        );
      }
    )
  );
