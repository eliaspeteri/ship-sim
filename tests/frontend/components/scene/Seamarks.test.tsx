import React from 'react';
import { render } from '@testing-library/react';
import {
  Seamarks,
  getSeamarkModelPath,
} from '../../../../src/components/scene/Seamarks';

const storeMock = jest.fn();
const useGLTFMock = jest.fn((..._args: unknown[]) => ({
  scene: { clone: () => ({}) },
}));
const useFrameMock = jest.fn();

jest.mock('../../../../src/store', () => ({
  __esModule: true,
  default: (selector: (state: unknown) => unknown) => storeMock(selector),
}));

jest.mock('@react-three/drei', () => ({
  useGLTF: (path: unknown) => useGLTFMock(path),
}));

jest.mock('@react-three/fiber', () => ({
  useFrame: (callback: unknown) => useFrameMock(callback),
  useThree: () => ({
    camera: {
      position: {
        distanceTo: () => 1000,
      },
    },
  }),
}));

jest.mock('../../../../src/lib/waves', () => ({
  deriveWaveState: jest.fn(() => ({ amp: 1 })),
  getGerstnerSample: jest.fn(() => ({
    height: 0.2,
    normal: { x: 0, y: 0, z: 1 },
  })),
}));

jest.mock('../../../../src/lib/geo', () => ({
  latLonToXY: jest.fn(({ lat, lon }) => ({ x: lon, y: lat })),
}));

describe('Seamarks', () => {
  beforeEach(() => {
    storeMock.mockReset();
    useGLTFMock.mockClear();
    useFrameMock.mockClear();
  });

  it('resolves seamark model paths for cardinal and lateral buoys', () => {
    expect(
      getSeamarkModelPath({
        'seamark:type': 'buoy_cardinal',
        'seamark:buoy_cardinal:category': 'east',
        'seamark:buoy_cardinal:shape': 'pillar',
      }),
    ).toEqual({
      path: '/models/cardinal_pillar_east.glb',
      dir: 'east',
    });

    expect(
      getSeamarkModelPath({
        'seamark:type': 'buoy_lateral',
        'seamark:buoy_lateral:category': 'starboard',
        'seamark:buoy_lateral:shape': 'can',
      }),
    ).toEqual({
      path: '/models/lateral_can_green.glb',
      dir: 'starboard',
    });

    expect(
      getSeamarkModelPath({
        'seamark:type': 'buoy_lateral',
        'seamark:buoy_lateral:colour': 'yellow',
      }),
    ).toEqual({
      path: '/models/lateral_spar_yellow.glb',
      dir: 'yellow',
    });

    expect(getSeamarkModelPath({ 'seamark:type': 'wreck' })).toBeNull();
  });

  it('groups supported seamark points by model path and loads GLTF once per group', () => {
    const state = {
      seamarks: {
        features: [
          {
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              'seamark:type': 'buoy_cardinal',
              'seamark:buoy_cardinal:category': 'north',
              'seamark:buoy_cardinal:shape': 'spar',
            },
          },
          {
            geometry: { type: 'Point', coordinates: [11, 21] },
            properties: {
              'seamark:type': 'buoy_cardinal',
              'seamark:buoy_cardinal:category': 'north',
              'seamark:buoy_cardinal:shape': 'spar',
            },
          },
          {
            geometry: { type: 'Point', coordinates: [12, 22] },
            properties: {
              'seamark:type': 'buoy_lateral',
              'seamark:buoy_lateral:category': 'port',
            },
          },
          {
            geometry: { type: 'LineString', coordinates: [] },
            properties: { 'seamark:type': 'buoy_cardinal' },
          },
          {
            geometry: { type: 'Point', coordinates: [13, 23] },
            properties: { 'seamark:type': 'other' },
          },
        ],
      },
      environment: { wind: { speed: 5 }, waves: { height: 1 } },
    };
    storeMock.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(state),
    );

    render(<Seamarks />);

    expect(useGLTFMock).toHaveBeenCalledWith('/models/cardinal_spar_north.glb');
    expect(useGLTFMock).toHaveBeenCalledWith('/models/lateral_spar_red.glb');
    expect(useGLTFMock).toHaveBeenCalledTimes(2);
    expect(useFrameMock).toHaveBeenCalled();
  });
});
