import { majorCities } from '../../../src/lib/majorCities';

describe('majorCities', () => {
  it('is an array of cities', () => {
    expect(Array.isArray(majorCities)).toBe(true);
    expect(majorCities.length).toBeGreaterThan(0);
  });

  it('each city has name, lat, lon', () => {
    majorCities.forEach(city => {
      expect(typeof city.name).toBe('string');
      expect(typeof city.lat).toBe('number');
      expect(typeof city.lon).toBe('number');
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lon).toBeGreaterThanOrEqual(-180);
      expect(city.lon).toBeLessThanOrEqual(180);
    });
  });

  it('includes well-known cities', () => {
    const names = majorCities.map(city => city.name);
    expect(names).toEqual(
      expect.arrayContaining(['New York', 'London', 'Tokyo']),
    );
  });
});
