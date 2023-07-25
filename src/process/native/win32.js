import { exec } from 'child_process';

export const getProcesses = () => new Promise(res => exec(`wmic process get ProcessID,ExecutablePath,Name /format:csv`, (e, out) => {
  res(out.toString().split('\r\n').slice(2).map(x => {
    // [ProcessId, Name, ExecutablePath]
    const parsed = x.trim().split(',').slice(1).reverse();
    return [ parseInt(parsed[0]) || parsed[0], parsed[2] || parsed[1] ];
  }).filter(x => x[1]));
}));