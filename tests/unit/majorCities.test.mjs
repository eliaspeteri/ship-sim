import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = jitiFactory(__filename);

const { majorCities } = jiti('../../src/lib/majorCities.ts');

describe('majorCities', () => {
  it('is an array of cities', () => {
    assert(Array.isArray(majorCities));
    assert(majorCities.length > 0);
  });

  it('each city has name, lat, lon', () => {
    majorCities.forEach(city => {
      assert(typeof city.name === 'string');
      assert(typeof city.lat === 'number');
      assert(typeof city.lon === 'number');
      assert(city.lat >= -90 && city.lat <= 90);
      assert(city.lon >= -180 && city.lon <= 180);
    });
  });

  it('includes well-known cities', () => {
    const names = majorCities.map(c => c.name);
    assert(names.includes('New York'));
    assert(names.includes('London'));
    assert(names.includes('Tokyo'));
  });
});
