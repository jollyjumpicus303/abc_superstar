import assert from 'node:assert/strict';
import { test } from 'node:test';

test('computeRunStars maps ratios to 0–5 scale', async () => {
  const module = await import('../app/rewardUtils.js');
  const { computeRunStars } = module;
  assert.equal(computeRunStars(0, 10), 0);
  assert.equal(computeRunStars(5, 10), 3);
  assert.equal(computeRunStars(10, 10), 5);
});

test('computeRunStars clamps noisy inputs', async () => {
  const module = await import('../app/rewardUtils.js');
  const { computeRunStars } = module;
  assert.equal(computeRunStars(100, 4), 5);
  assert.equal(computeRunStars(-1, 6), 0);
  assert.equal(computeRunStars(3, 0), 0);
});
