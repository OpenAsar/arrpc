import test from 'node:test';
import assert from 'node:assert/strict';

import { createScanRunner } from '../src/process/scan-runner.js';

test('does not start a scan while the previous scan is still running', async () => {
  let starts = 0;
  let finishFirstScan;

  const runner = createScanRunner(() => {
    starts++;
    return new Promise(resolve => {
      finishFirstScan = resolve;
    });
  });

  const first = runner();
  const second = runner();

  assert.equal(starts, 1);
  assert.equal(await second, false);

  finishFirstScan();
  assert.equal(await first, true);

  const third = runner();
  assert.equal(starts, 2);
  finishFirstScan();
  assert.equal(await third, true);
});
