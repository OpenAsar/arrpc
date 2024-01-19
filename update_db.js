#!/usr/bin/env node
import { createWriteStream, readFileSync } from 'fs';
import { get } from 'https';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const path = join(__dirname, 'src', 'process', 'detectable.json');

const current = JSON.parse(readFileSync(path, 'utf8'));

const file = createWriteStream(path);
get('https://discord.com/api/v9/applications/detectable', res => {
  res.pipe(file);

  file.on('finish', () => {
    file.close();

    const updated = JSON.parse(readFileSync(path, 'utf8'));
    console.log('Updated detectable DB');
    console.log(`${current.length} -> ${updated.length} games (+${updated.length - current.length})`);

    const oldNames = current.map(x => x.name);
    const newNames = updated.map(x => x.name);
    console.log(newNames.filter(x => !oldNames.includes(x)));
  })
});