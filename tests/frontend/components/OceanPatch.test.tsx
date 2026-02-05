import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useFrame } from '@react-three/fiber';

jest.mock('../../../src/lib/waves', () => ({
  getWaveComponents: jest.fn(),
}));

jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useRef: jest.fn((initial: any) => {
      if (initial === null) {
        const positionSet = jest.fn();
        const scaleSet = jest.fn();
        const ref = {
          current: {
            position: { set: positionSet },
            scale: { set: scaleSet },
          },
        };
        (globalThis as any).__meshRef = ref;
        return ref;
      }
      return actual.useRef(initial);
    }),
    default: actual,
  };
});

jest.mock('three', () => {
  class MockVector2 {
    constructor(
      public x = 0,
      public y = 0,
    ) {}
    set(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
  }

  class MockVector3 {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
    ) {}
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    copy(v: { x: number; y: number; z: number }) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
    normalize() {
      return this;
    }
  }

  class MockColor {
    constructor(public value: any) {}
    clone() {
      return new MockColor(this.value);
    }
    lerp(_color: MockColor, _t: number) {
      return this;
    }
    multiplyScalar(_value: number) {
      return this;
    }
    copy(color: MockColor) {
      this.value = color.value;
      return this;
    }
  }

  class MockPlaneGeometry {
    rotateX = jest.fn();
    dispose = jest.fn();
    constructor(
      public width: number,
      public height: number,
      public widthSegments: number,
      public heightSegments: number,
    ) {
      (globalThis as any).__lastGeometry = this;
    }
  }

  class MockShaderMaterial {
    uniforms: any;
    toneMapped = false;
    dispose = jest.fn();
    constructor(params: any) {
      this.uniforms = params.uniforms;
      (globalThis as any).__lastMaterial = this;
    }
  }

  const UniformsLib = { fog: {} };
  const UniformsUtils = {
    merge: (items: any[]) =>
      items.reduce((acc, item) => ({ ...acc, ...item }), {}),
  };
  const MathUtils = {
    lerp: (a: number, b: number, t: number) => a + (b - a) * t,
    clamp: (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max),
  };

  return {
    Vector2: MockVector2,
    Vector3: MockVector3,
    Color: MockColor,
    PlaneGeometry: MockPlaneGeometry,
    ShaderMaterial: MockShaderMaterial,
    UniformsLib,
    UniformsUtils,
    MathUtils,
    DoubleSide: 'DoubleSide',
  };
});

import * as THREE from 'three';
import { getWaveComponents } from '../../../src/lib/waves';
import { OceanPatch } from '../../../src/components/OceanPatch';

describe('OceanPatch', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures uniforms and updates per frame', async () => {
    const components = Array.from({ length: 6 }, (_v, i) => ({
      amplitude: i + 1,
      k: (i + 1) * 0.01,
      omega: (i + 1) * 0.02,
      dirX: 1,
      dirY: 0,
    }));
    (getWaveComponents as jest.Mock).mockReturnValue(components);

    const wave = {
      amplitude: 1,
      wavelength: 2,
      direction: 45,
      steepness: 0.5,
      speed: 3,
      k: 0.1,
      omega: 0.2,
    };

    const centerRef = { current: { x: 10, y: 20 } };
    const sunDirection = new THREE.Vector3(0, 1, 0);

    const { unmount } = render(
      <OceanPatch
        centerRef={centerRef as any}
        wave={wave}
        sunDirection={sunDirection}
      />,
    );

    await waitFor(() => {
      const material = (globalThis as any).__lastMaterial;
      expect(material).toBeTruthy();
      expect(material.uniforms.uAmp.value).toEqual(
        components.map(c => c.amplitude),
      );
      expect(material.uniforms.uK.value).toEqual(components.map(c => c.k));
      expect(material.uniforms.uOmega.value).toEqual(
        components.map(c => c.omega),
      );
    });

    const meshRef = (globalThis as any).__meshRef;
    // React will attach the ref to the DOM node for <mesh/>; override for test.
    meshRef.current = {
      position: { set: jest.fn() },
      scale: { set: jest.fn() },
    };

    const frameCb = (useFrame as jest.Mock).mock.calls[0][0];
    frameCb({ camera: { position: new THREE.Vector3(0, 440, 0) } }, 0.5);

    const material = (globalThis as any).__lastMaterial;
    expect(material.uniforms.uTime.value).toBe(0.5);
    expect(material.uniforms.uFadeStart.value).toBeCloseTo(2800);
    expect(material.uniforms.uFadeEnd.value).toBeCloseTo(4000);
    expect(material.uniforms.uCenter.value.x).toBe(10);
    expect(material.uniforms.uCenter.value.y).toBe(20);
    expect(material.uniforms.uCameraPos.value.y).toBe(440);

    expect(meshRef.current.position.set).toHaveBeenCalledWith(10, 0, 20);
    expect(meshRef.current.scale.set).toHaveBeenCalled();

    unmount();
    const geometry = (globalThis as any).__lastGeometry;
    expect(geometry.dispose).toHaveBeenCalled();
    expect(material.dispose).toHaveBeenCalled();
  });
});
