import { exec } from 'child_process';

export const getProcesses = () => new Promise(res => exec(`wmic process get ProcessID,ExecutablePath,Name /format:csv`, (e, out) => {
  res(out.toString().split('\r\n').slice(2).map(x => {
    const parsed = x.trim().split(',').slice(1).reverse();
    parsed[0] = parseInt(parsed[0]) || parsed[0]; // pid to int
    parsed[1] = parsed[2] || parsed[1]
    return parsed.slice(0, 2);
  }).filter(x => x[1]));
}));