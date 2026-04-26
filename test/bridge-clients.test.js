import test from 'node:test';
import assert from 'node:assert/strict';

import { sendToBridgeClients } from '../src/bridge-clients.js';

test('does not queue messages for clients that are not open', () => {
  const sent = [];
  const clients = [
    {
      readyState: 3,
      send: msg => sent.push(msg)
    }
  ];

  sendToBridgeClients(clients, { activity: { name: 'Example' } }, { openState: 1 });

  assert.deepEqual(sent, []);
});

test('terminates bridge clients with too much queued data', () => {
  let terminated = false;
  let sent = false;
  const clients = [
    {
      readyState: 1,
      bufferedAmount: 1025,
      send: () => {
        sent = true;
      },
      terminate: () => {
        terminated = true;
      }
    }
  ];

  sendToBridgeClients(clients, { activity: { name: 'Example' } }, {
    maxBufferedAmount: 1024,
    openState: 1
  });

  assert.equal(sent, false);
  assert.equal(terminated, true);
});
