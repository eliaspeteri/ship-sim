import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { deriveWaveState, getGerstnerSample } = jiti('../../src/lib/waves.ts');

test('deriveWaveState produces bounded wave parameters', () => {
  const wave = deriveWaveState({
    wind: { speed: 12, direction: Math.PI / 3, gusting: false, gustFactor: 1 },
    current: { speed: 0.3, direction: 0, variability: 0 },
    seaState: 6,
    timeOfDay: 12,
  });
  assert.ok(wave.amplitude > 0);
  assert.ok(wave.wavelength >= 12);
  assert.ok(wave.steepness <= 0.8);
});

test('gerstner sample returns height and normal', () => {
  const wave = deriveWaveState({
    wind: { speed: 5, direction: 0, gusting: false, gustFactor: 1 },
    current: { speed: 0, direction: 0, variability: 0 },
    seaState: 2,
    timeOfDay: 12,
  });
  const sample = getGerstnerSample(10, 20, 1.2, wave);
  assert.ok(Number.isFinite(sample.height));
  assert.ok(Number.isFinite(sample.normal.x));
  assert.ok(Number.isFinite(sample.normal.y));
});
