import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { safe } = jiti('../../src/lib/safe.ts');

describe('safe', () => {
  it('returns value if finite number', () => {
    assert.equal(safe(5, 10), 5);
    assert.equal(safe(0, 10), 0);
    assert.equal(safe(-5, 10), -5);
  });

  it('returns fallback for non-finite numbers', () => {
    assert.equal(safe(NaN, 10), 10);
    assert.equal(safe(Infinity, 10), 10);
    assert.equal(safe(-Infinity, 10), 10);
  });

  it('returns fallback for non-numbers', () => {
    assert.equal(safe('string', 10), 10);
    assert.equal(safe(null, 10), 10);
    assert.equal(safe(undefined, 10), 10);
    assert.equal(safe({}, 10), 10);
  });

  it('returns fallback as-is', () => {
    assert.equal(safe(NaN, 'fallback'), 'fallback');
    assert.equal(safe(NaN, null), null);
  });
});
