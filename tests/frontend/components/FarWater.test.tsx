import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FarWater } from '../../../src/components/FarWater';

jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
}));

describe('FarWater', () => {
  it('registers a frame handler and renders mesh', () => {
    const centerRef = { current: { x: 10, y: 20 } };
    const sunDirection = new THREE.Vector3(0, 1, 0);

    const { container } = render(
      <FarWater centerRef={centerRef} sunDirection={sunDirection} />,
    );

    expect(useFrame).toHaveBeenCalledTimes(1);
    expect(container.querySelector('mesh')).toBeTruthy();
    expect(container.querySelector('planegeometry')).toBeTruthy();
    expect(container.querySelector('meshstandardmaterial')).toBeTruthy();
  });
});
