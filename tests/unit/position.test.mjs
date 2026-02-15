import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const {
  distanceMeters,
  positionFromLatLon,
  positionFromXY,
  mergePosition,
  ensurePosition,
  positionToXY,
  positionToLatLon,
  worldVelocityFromBody,
  bodyVelocityFromWorld,
  speedFromWorldVelocity,
  courseFromWorldVelocity,
} = jiti('../../src/lib/position.ts');

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

test('mergePosition with lat/lon update', () => {
  const current = positionFromLatLon({ lat: 0, lon: 0, z: 5 });
  const updated = mergePosition(current, { lat: 1, lon: 2 });
  assert.equal(updated.lat, 1);
  assert.equal(updated.lon, 2);
  assert.equal(updated.z, 5);
});

test('mergePosition with x/y update', () => {
  const current = positionFromLatLon({ lat: 0, lon: 0, z: 5 });
  const updated = mergePosition(current, { x: 1000, y: 2000 });
  assert.ok(updated.x !== undefined && Math.abs(updated.x - 1000) < 1);
  assert.ok(updated.y !== undefined && Math.abs(updated.y - 2000) < 1);
  assert.equal(updated.z, 5);
});

test('mergePosition with no update', () => {
  const current = positionFromLatLon({ lat: 1, lon: 2, z: 3 });
  const updated = mergePosition(current);
  assert.equal(updated.lat, 1);
  assert.equal(updated.lon, 2);
  assert.equal(updated.z, 3);
});

test('ensurePosition with lat/lon', () => {
  const pos = ensurePosition({ lat: 1, lon: 2, z: 3 });
  assert.equal(pos.lat, 1);
  assert.equal(pos.lon, 2);
  assert.equal(pos.z, 3);
});

test('ensurePosition with x/y', () => {
  const pos = ensurePosition({ x: 1000, y: 2000, z: 3 });
  assert.ok(pos.x !== undefined && Math.abs(pos.x - 1000) < 1);
  assert.ok(pos.y !== undefined && Math.abs(pos.y - 2000) < 1);
  assert.equal(pos.z, 3);
});

test('ensurePosition with partial', () => {
  const pos = ensurePosition({ z: 5 });
  assert.equal(pos.lat, 0);
  assert.equal(pos.lon, 0);
  assert.equal(pos.z, 5);
});

test('ensurePosition with undefined', () => {
  const pos = ensurePosition();
  assert.equal(pos.lat, 0);
  assert.equal(pos.lon, 0);
  assert.equal(pos.z, 0);
});

test('positionToXY and positionToLatLon are inverses', () => {
  const original = { lat: 45, lon: 90 };
  const xy = positionToXY(original);
  const back = positionToLatLon(xy);
  assert.ok(Math.abs(back.lat - original.lat) < 1e-6);
  assert.ok(Math.abs(back.lon - original.lon) < 1e-6);
});

test('worldVelocityFromBody converts correctly', () => {
  const heading = Math.PI / 4; // 45 degrees
  const velocity = worldVelocityFromBody(heading, { surge: 1, sway: 0 });
  assert.ok(Math.abs(velocity.x - Math.cos(heading)) < 1e-6);
  assert.ok(Math.abs(velocity.y - Math.sin(heading)) < 1e-6);
});

test('bodyVelocityFromWorld converts correctly', () => {
  const heading = Math.PI / 4;
  const world = { x: 1, y: 0 };
  const body = bodyVelocityFromWorld(heading, world);
  const expectedSurge =
    world.x * Math.cos(heading) + world.y * Math.sin(heading);
  const expectedSway =
    -world.x * Math.sin(heading) + world.y * Math.cos(heading);
  assert.ok(Math.abs(body.surge - expectedSurge) < 1e-6);
  assert.ok(Math.abs(body.sway - expectedSway) < 1e-6);
});

test('speedFromWorldVelocity calculates hypot', () => {
  const speed = speedFromWorldVelocity({ x: 3, y: 4 });
  assert.equal(speed, 5);
});

test('courseFromWorldVelocity calculates angle', () => {
  const course = courseFromWorldVelocity({ x: 1, y: 0 });
  assert.equal(course, 90); // atan2(1,0) = 90 degrees
});

test('courseFromWorldVelocity handles negative', () => {
  const course = courseFromWorldVelocity({ x: -1, y: 0 });
  assert.equal(course, 270);
});
