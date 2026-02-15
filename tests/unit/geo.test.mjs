import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { xyToLatLon, latLonToXY, bboxAroundLatLon } = jiti(
  '../../src/lib/geo.ts',
);

test('xyToLatLon converts XY to LatLon correctly', () => {
  const xy = { x: 0, y: 0 };
  const latLon = xyToLatLon(xy);
  assert.equal(latLon.lat, 0);
  assert.equal(latLon.lon, 0);
});

test('latLonToXY converts LatLon to XY correctly', () => {
  const latLon = { lat: 0, lon: 0 };
  const xy = latLonToXY(latLon);
  assert.equal(xy.x, 0);
  assert.equal(xy.y, 0);
});

test('xyToLatLon and latLonToXY are inverses', () => {
  const original = { lat: 45, lon: 90 };
  const xy = latLonToXY(original);
  const back = xyToLatLon(xy);
  assert.ok(Math.abs(back.lat - original.lat) < 1e-6);
  assert.ok(Math.abs(back.lon - original.lon) < 1e-6);
});

test('bboxAroundLatLon with corner=true', () => {
  const bbox = bboxAroundLatLon({
    lat: 0,
    lon: 0,
    radiusMeters: 1000,
    corner: true,
  });
  assert.ok(bbox.south < 0);
  assert.ok(bbox.north > 0);
  assert.ok(bbox.west < 0);
  assert.ok(bbox.east > 0);
  assert.ok(bbox.north - bbox.south > 0);
  assert.ok(bbox.east - bbox.west > 0);
});

test('bboxAroundLatLon with corner=false', () => {
  const bbox = bboxAroundLatLon({
    lat: 0,
    lon: 0,
    radiusMeters: 1000,
    corner: false,
  });
  assert.ok(bbox.south < 0);
  assert.ok(bbox.north > 0);
  assert.ok(bbox.west < 0);
  assert.ok(bbox.east > 0);
});

test('bboxAroundLatLon defaults to corner=true', () => {
  const bbox1 = bboxAroundLatLon({ lat: 0, lon: 0, radiusMeters: 1000 });
  const bbox2 = bboxAroundLatLon({
    lat: 0,
    lon: 0,
    radiusMeters: 1000,
    corner: true,
  });
  assert.deepEqual(bbox1, bbox2);
});
