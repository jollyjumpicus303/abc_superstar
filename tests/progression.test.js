import assert from 'node:assert/strict';
import { test } from 'node:test';

async function loadModule() {
  if (!loadModule.cache) {
    loadModule.cache = import('../app/progression.js');
  }
  return loadModule.cache;
}
loadModule.cache = null;

test('failure resets flawless streak but keeps unlocked', async () => {
  const { advanceAfterRun } = await loadModule();
  const next = advanceAfterRun({
    result: { success: false },
    state: { unlocked: 12, flawlessStreak: 1, audioSet: 'ANLAUT' },
  });
  assert.equal(next.unlocked, 12);
  assert.equal(next.flawlessStreak, 0);
  assert.equal(next.audioSet, 'ANLAUT');
});

test('two successes unlock four more letters', async () => {
  const { advanceAfterRun } = await loadModule();
  const first = advanceAfterRun({
    result: { success: true },
    state: { unlocked: 8, flawlessStreak: 1, audioSet: 'ANLAUT' },
  });
  assert.equal(first.unlocked, 12);
  assert.equal(first.flawlessStreak, 0);
});

test('success increments streak when not yet two in a row', async () => {
  const { advanceAfterRun } = await loadModule();
  const next = advanceAfterRun({
    result: { mistakes: 0 },
    state: { unlocked: 8, flawlessStreak: 0, audioSet: 'ANLAUT' },
  });
  assert.equal(next.unlocked, 8);
  assert.equal(next.flawlessStreak, 1);
});

test('switches to OHNE_ANLAUT after two flawless runs at 26', async () => {
  const { advanceAfterRun } = await loadModule();
  const first = advanceAfterRun({
    result: { success: true },
    state: { unlocked: 26, flawlessStreak: 1, audioSet: 'ANLAUT' },
  });
  assert.equal(first.audioSet, 'OHNE_ANLAUT');
  assert.equal(first.unlocked, 4);
  assert.equal(first.flawlessStreak, 0);
});

test('continues progression within OHNE_ANLAUT set', async () => {
  const { advanceAfterRun } = await loadModule();
  const base = { unlocked: 4, flawlessStreak: 1, audioSet: 'OHNE_ANLAUT' };
  const next = advanceAfterRun({ result: { success: true }, state: base });
  assert.equal(next.unlocked, 8);
  assert.equal(next.flawlessStreak, 0);
  assert.equal(next.audioSet, 'OHNE_ANLAUT');
});

test('non-multiples of four in state are clamped to nearest step', async () => {
  const { advanceAfterRun } = await loadModule();
  const next = advanceAfterRun({
    result: { success: false },
    state: { unlocked: 5, flawlessStreak: 0, audioSet: 'ANLAUT' },
  });
  assert.equal(next.unlocked, 8);
});

test('throws if result lacks success info', async () => {
  const { advanceAfterRun } = await loadModule();
  assert.throws(() => advanceAfterRun({ result: {}, state: {} }));
});
