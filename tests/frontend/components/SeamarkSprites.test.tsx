import { useFrame, useThree } from '@react-three/fiber';
import { render } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';

import SeamarkSprites from '../../../src/components/SeamarkSprites';
import useStore from '../../../src/store';

import type { SimulationState } from '../../../src/store/types';


jest.mock('@react-three/fiber', () => ({
  useThree: jest.fn(),
  useFrame: jest.fn(),
}));

jest.mock('../../../src/store');

const useStoreMock = useStore as jest.MockedFunction<typeof useStore>;
const useThreeMock = useThree as jest.MockedFunction<typeof useThree>;
const useFrameMock = useFrame as jest.MockedFunction<typeof useFrame>;

const baseState = {
  seamarks: { features: [] as unknown[] },
  environment: { timeOfDay: 12 },
};

const renderWithState = (stateOverride: Partial<typeof baseState>) => {
  const state = { ...baseState, ...stateOverride };
  type StoreState = typeof state;
  useStoreMock.mockImplementation(selector =>
    selector(state as StoreState as unknown as SimulationState),
  );
  useThreeMock.mockReturnValue({ camera: new THREE.PerspectiveCamera() });
  return render(<SeamarkSprites />);
};

describe('SeamarkSprites', () => {
  beforeEach(() => {
    useFrameMock.mockClear();
  });

  it('returns null when no seamarks are present', () => {
    const { container } = renderWithState({
      seamarks: { features: [] },
    });

    expect(container.firstChild).toBeNull();
    expect(useFrameMock).toHaveBeenCalledTimes(1);
  });

  it('renders points and registers a frame handler for seamarks', () => {
    const { container } = renderWithState({
      seamarks: {
        features: [
          {
            id: 'a',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              'seamark:type': 'cardinal',
              'seamark:buoy_cardinal:category': 'east',
            },
          },
        ],
      },
      environment: { timeOfDay: 20 },
    });

    expect(container.querySelector('points')).toBeTruthy();
    expect(useFrameMock).toHaveBeenCalledTimes(1);
  });
});
