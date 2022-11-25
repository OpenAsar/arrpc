import { exec } from 'child_process';

export const getProcesses = () => new Promise(res => exec(`wmic process get ProcessID,ExecutablePath /format:csv`, (e, out) => {
  res(out.toString().split('\r\n').slice(2).map(x => x.trim().split(',').slice(1).reverse()).filter(x => x[1]));
}));