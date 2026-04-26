import test from 'node:test';
import assert from 'node:assert/strict';

import { createBridgeState } from '../src/bridge-state.js';

test('removes cached activity when a socket clears it', () => {
  const state = createBridgeState();
  const active = {
    socketId: '1',
    activity: {
      name: 'Example'
    }
  };

  state.update(active);
  assert.deepEqual(state.replayable(), [active]);

  state.update({
    socketId: '1',
    activity: null
  });

  assert.equal(state.size, 0);
  assert.deepEqual(state.replayable(), []);
});

test('does not grow when inactive sockets report null activity', () => {
  const state = createBridgeState();

  for (let i = 0; i < 1000; i++) {
    state.update({
      socketId: String(i),
      activity: null
    });
  }

  assert.equal(state.size, 0);
});
