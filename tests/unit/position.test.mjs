import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { distanceMeters, positionFromLatLon, positionFromXY } = jiti(
  '../../src/lib/position.ts',
);

test('distanceMeters approximates meters for 1 degree lat', () => {
  const a = { lat: 0, lon: 0 };
  const b = { lat: 1, lon: 0 };
  const dist = distanceMeters(a, b);
  assert.ok(dist > 110000, 'distance should exceed 110 km');
  assert.ok(dist < 112500, 'distance should stay below 112.5 km');
});

test('position conversions keep z value', () => {
  const pos = positionFromLatLon({ lat: 12.5, lon: -45.2, z: 9 });
  const back = positionFromXY({ x: pos.x, y: pos.y, z: pos.z });
  assert.equal(back.z, 9);
  assert.ok(Math.abs(back.lat - 12.5) < 0.001);
  assert.ok(Math.abs(back.lon + 45.2) < 0.001);
});
