#!/usr/bin/env node
import { createWriteStream, readFileSync } from 'fs';
import { get } from 'https';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));

const path = join(__dirname, 'src', 'process', 'detectable.json');

const current = require(path);

const file = createWriteStream(path);
get('https://discord.com/api/v9/applications/detectable', res => {
  res.pipe(file);

  file.on('finish', () => {
    file.close();

    const updated = require(path);
    console.log('Updated detectable DB');
    console.log(`${current.length} -> ${updated.length} games (+${updated.length - current.length})`);

    const oldNames = current.map(x => x.name);
    const newNames = updated.map(x => x.name);
    console.log(newNames.filter(x => !oldNames.includes(x)));
  })
});