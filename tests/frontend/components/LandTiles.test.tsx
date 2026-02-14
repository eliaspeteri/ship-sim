import React from 'react';
import { render, waitFor } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import { LandTiles } from '../../../src/components/LandTiles';

jest.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: {
      position: { x: 0, y: 0, z: 0 },
    },
  }),
}));

jest.mock('../../../src/lib/tiles/mvtLandMesh', () => ({
  fetchLandTileMesh: jest.fn(),
}));

jest.mock('../../../src/lib/geo', () => ({
  xyToLatLon: jest.fn(),
}));

import { fetchLandTileMesh } from '../../../src/lib/tiles/mvtLandMesh';
import { xyToLatLon } from '../../../src/lib/geo';

describe('LandTiles', () => {
  beforeEach(() => {
    (xyToLatLon as jest.Mock).mockReturnValue({ lat: 0, lon: 0 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads and renders tiles for the focus point', async () => {
    const mesh = {
      geometry: { dispose: jest.fn() },
      material: { dispose: jest.fn() },
    };
    (fetchLandTileMesh as jest.Mock).mockResolvedValue(mesh);

    const focusRef = { current: { x: 0, y: 0 } };
    const setIntervalSpy = jest.spyOn(window, 'setInterval');
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    const { container, unmount } = render(
      <LandTiles
        focusRef={focusRef as MutableRefObject<{ x: number; y: number }>}
        radius={0}
      />,
    );

    await waitFor(() => {
      expect(fetchLandTileMesh).toHaveBeenCalled();
    });

    expect(fetchLandTileMesh).toHaveBeenCalledWith(
      expect.objectContaining({ z: 13, x: 4096, y: 4096 }),
    );

    await waitFor(() => {
      expect(container.querySelectorAll('primitive')).toHaveLength(1);
    });

    unmount();
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
