import {
  bboxAroundLatLonGeodesic,
  querySeamarksBBox,
} from '../../../../src/server/seamarks';
import { registerSeamarksHandler } from '../../../../src/server/socketHandlers/seamarks';

jest.mock('../../../../src/server/seamarks', () => ({
  bboxAroundLatLonGeodesic: jest.fn(() => ({
    south: 1,
    west: 2,
    north: 3,
    east: 4,
  })),
  querySeamarksBBox: jest.fn(() => [{ id: 's-1' }]),
}));

describe('registerSeamarksHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits seamarks data for valid request', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
    };

    registerSeamarksHandler({ socket } as unknown as Parameters<
      typeof registerSeamarksHandler
    >[0]);

    handlers['seamarks:nearby']({ lat: 10, lon: 20, radiusMeters: 5000 });

    expect(bboxAroundLatLonGeodesic).toHaveBeenCalledWith({
      lat: 10,
      lon: 20,
      radiusMeters: 5000,
      corner: true,
    });
    expect(querySeamarksBBox).toHaveBeenCalledWith({
      south: 1,
      west: 2,
      north: 3,
      east: 4,
      limit: 5000,
    });
    expect(socket.emit).toHaveBeenCalledWith('seamarks:data', {
      type: 'FeatureCollection',
      features: [{ id: 's-1' }],
      meta: {
        lat: 10,
        lon: 20,
        radiusMeters: 5000,
        bbox: { south: 1, west: 2, north: 3, east: 4 },
      },
    });
  });

  it('ignores invalid coordinates', () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const socket = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
    };

    registerSeamarksHandler({ socket } as unknown as Parameters<
      typeof registerSeamarksHandler
    >[0]);

    handlers['seamarks:nearby']({ lat: 'nope', lon: 20 });

    expect(socket.emit).not.toHaveBeenCalled();
    expect(querySeamarksBBox).not.toHaveBeenCalled();
  });
});
