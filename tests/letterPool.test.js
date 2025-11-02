import assert from 'node:assert/strict';
import { test } from 'node:test';

async function loadModule() {
  if (!loadModule.cache) {
    loadModule.cache = import('../app/letterPool.js');
  }
  return loadModule.cache;
}
loadModule.cache = null;

function createRng(sequence) {
  let index = 0;
  return () => {
    if (!sequence.length) return 0;
    const value = sequence[index] ?? sequence[sequence.length - 1];
    index += 1;
    return value;
  };
}

test('pickNext returns one of the pool letters', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({ pool: ['a', 'b', 'c'], rng: createRng([0]) });
  assert.ok(['A', 'B', 'C'].includes(result));
});

test('pickNext avoids repeating the last letter when possible', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({ pool: ['A', 'B'], last: 'A', rng: createRng([0]) });
  assert.equal(result, 'B');
});

test('pickNext allows repeat if pool size is one', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({ pool: ['A'], last: 'A', rng: createRng([0.5]) });
  assert.equal(result, 'A');
});

test('pickNext forces wrong letter after two non-error picks', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({
    pool: ['A', 'B', 'C'],
    recent: ['C', 'A'],
    wrongCounts: { B: 1 },
    rng: createRng([0.3]),
  });
  assert.equal(result, 'B');
});

test('pickNext prefers higher weight letters', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({
    pool: ['A', 'B'],
    wrongCounts: { B: 3 },
    rng: createRng([0.2]),
  });
  assert.equal(result, 'B');
});

test('pickNext respects recent avoidance when alternatives exist', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({
    pool: ['A', 'B', 'C'],
    recent: ['B'],
    rng: createRng([0]),
  });
  assert.ok(['A', 'C'].includes(result));
  assert.notEqual(result, 'B');
});

test('pickNext falls back to wrong letter even if recently used', async () => {
  const { pickNext } = await loadModule();
  const result = pickNext({
    pool: ['A', 'B'],
    last: 'A',
    recent: ['B', 'A'],
    wrongCounts: { B: 2 },
    rng: createRng([0.1]),
  });
  assert.equal(result, 'B');
});

test('makeOptions includes correct letter exactly once', async () => {
  const { makeOptions } = await loadModule();
  const options = makeOptions({ correct: 'a', pool: ['a', 'b', 'c', 'd'], size: 4, rng: createRng([0, 0.5, 0.9, 0.2]) });
  assert.equal(options.filter((l) => l === 'A').length, 1);
  assert.equal(new Set(options).size, options.length);
  assert.equal(options.length, 4);
});

test('makeOptions deduplicates pool inputs', async () => {
  const { makeOptions } = await loadModule();
  const pool = ['A', 'a', 'B', 'B'];
  const options = makeOptions({ correct: 'A', pool, size: 3, rng: createRng([0.4, 0.6, 0.8]) });
  assert.equal(new Set(options).size, options.length);
  assert.ok(options.includes('A'));
});

test('makeOptions returns available letters when size exceeds pool', async () => {
  const { makeOptions } = await loadModule();
  const options = makeOptions({ correct: 'A', pool: ['A', 'B'], size: 5, rng: createRng([0.3, 0.7]) });
  assert.equal(options.length, 2);
  assert.ok(options.includes('A'));
  assert.ok(options.includes('B'));
});

test('makeOptions does not mutate input pool', async () => {
  const { makeOptions } = await loadModule();
  const pool = ['A', 'B', 'C'];
  makeOptions({ correct: 'A', pool, size: 3, rng: createRng([0.1, 0.4, 0.7]) });
  assert.deepEqual(pool, ['A', 'B', 'C']);
});

test('makeOptions shuffle uses rng for deterministic order', async () => {
  const { makeOptions } = await loadModule();
  const rng = createRng([0.2, 0.1, 0.8, 0.4, 0.3, 0.05]);
  const options = makeOptions({ correct: 'A', pool: ['A', 'B', 'C', 'D'], size: 4, rng });
  assert.deepEqual(options, ['D', 'C', 'A', 'B']);
});
