jest.mock('fs/promises', () => {
  const readFile = jest.fn();
  return {
    __esModule: true,
    readFile,
    default: { readFile },
  };
});

const buildGeojson = () => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [179.9, 10] },
      properties: { 'seamark:type': 'buoy_lateral', osm_id: 1 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-179.9, 10] },
      properties: { 'seamark:type': 'buoy_lateral', osm_id: 2 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { 'seamark:type': 'landmark' },
    },
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] },
      properties: { 'seamark:type': 'buoy_lateral' },
    },
  ],
});

describe('seamarks', () => {
  beforeEach(() => {
    jest.resetModules();
    const fsPromises = require('fs/promises');
    (fsPromises.readFile as jest.Mock).mockReset();
  });

  it('loads seamarks and queries with dateline crossing', async () => {
    const fsPromises = require('fs/promises');
    (fsPromises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(buildGeojson()),
    );

    const seamarks = await import('../../../src/server/seamarks');

    await seamarks.loadSeamarks();
    const results = seamarks.querySeamarksBBox({
      south: 5,
      north: 15,
      west: 170,
      east: -170,
    });

    expect(results).toHaveLength(2);
    expect(results[0].geometry.type).toBe('Point');
  });

  it('builds a geodesic bbox around a point', () => {
    const seamarks = require('../../../src/server/seamarks');
    const bbox = seamarks.bboxAroundLatLonGeodesic({
      lat: 0,
      lon: 0,
      radiusMeters: 1000,
    });

    expect(bbox.north).toBeGreaterThan(bbox.south);
    expect(bbox.east).toBeGreaterThanOrEqual(-180);
    expect(bbox.west).toBeLessThanOrEqual(180);
  });
});
