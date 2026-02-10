import React from 'react';
import { act, render, screen } from '@testing-library/react';
import * as THREE from 'three';

import EditorRenderer from '../../../../../src/features/editor/components/EditorRenderer';

const frameCallbacks: Array<
  (state: { camera: THREE.Camera }, delta: number) => void
> = [];
const mockLatLonToXY = jest.fn();
const mockOrbitProps: Array<Record<string, unknown>> = [];
let mockCamera: THREE.PerspectiveCamera;
let mockControls: {
  object: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  update: jest.Mock;
};

jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: (
    callback: (state: { camera: THREE.Camera }, delta: number) => void,
  ) => {
    frameCallbacks.push(callback);
  },
  useThree: () => ({ camera: mockCamera }),
}));

jest.mock('@react-three/drei', () => {
  const ReactLocal = require('react');
  return {
    OrbitControls: ReactLocal.forwardRef(
      (props: Record<string, unknown>, ref: React.ForwardedRef<unknown>) => {
        mockOrbitProps.push(props);
        ReactLocal.useEffect(() => {
          if (typeof ref === 'function') {
            ref(mockControls);
            return;
          }
          if (ref) {
            (ref as React.MutableRefObject<unknown>).current = mockControls;
          }
        }, [ref]);
        return <div data-testid="orbit-controls" />;
      },
    ),
    Line: () => <div data-testid="line" />,
  };
});

jest.mock('../../../../../src/components/LandTiles', () => ({
  LandTiles: () => <div data-testid="land-tiles" />,
}));

jest.mock('../../../../../src/components/OceanPatch', () => ({
  OceanPatch: () => <div data-testid="ocean-patch" />,
}));

jest.mock('../../../../../src/lib/geo', () => ({
  latLonToXY: (...args: unknown[]) => mockLatLonToXY(...args),
}));

const runFrames = (times = 1) => {
  for (let i = 0; i < times; i += 1) {
    act(() => {
      frameCallbacks.forEach(callback =>
        callback({ camera: mockCamera }, 0.016),
      );
    });
  }
};

describe('EditorRenderer', () => {
  beforeEach(() => {
    frameCallbacks.splice(0, frameCallbacks.length);
    mockOrbitProps.splice(0, mockOrbitProps.length);
    mockLatLonToXY.mockReset();
    mockLatLonToXY.mockImplementation(({ lat, lon }) => ({
      x: lon * 1000,
      y: lat * 1000,
    }));
    mockCamera = new THREE.PerspectiveCamera(55, 1.6, 2, 30000);
    mockCamera.position.set(200, 220, -200);
    mockControls = {
      object: mockCamera,
      target: new THREE.Vector3(0, 0, 0),
      update: jest.fn(),
    };
  });

  it('renders canvas scene and uses default max distance', () => {
    render(
      <EditorRenderer
        focusRef={{ current: { x: 0, y: 0 } }}
        cameraStateRef={{ current: { y: 220, fov: 55, aspect: 1.6 } }}
      />,
    );

    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('ocean-patch')).toBeInTheDocument();
    expect(screen.getByTestId('land-tiles')).toBeInTheDocument();
    expect(mockOrbitProps.at(-1)?.maxDistance).toBe(12000);
  });

  it('derives max distance from work area bounds and updates focus from controls', () => {
    const focusRef = { current: { x: 0, y: 0 } };
    render(
      <EditorRenderer
        focusRef={focusRef}
        cameraStateRef={{ current: { y: 220, fov: 55, aspect: 1.6 } }}
        workAreas={[
          {
            id: 'wa-1',
            name: 'A',
            bounds: {
              type: 'bbox',
              minLat: 60,
              maxLat: 61,
              minLon: 24,
              maxLon: 25,
            },
            allowedZoom: [0, 16],
            sources: [],
          },
        ]}
      />,
    );

    expect(mockOrbitProps.at(-1)?.maxDistance).toBeGreaterThan(2000);
    mockControls.target.set(321, 0, 654);
    runFrames();
    expect(focusRef.current).toEqual({ x: 321, y: 654 });
  });

  it('applies focus target and updates camera state + heading callback', () => {
    const focusRef = { current: { x: 0, y: 0 } };
    const cameraStateRef = { current: { y: 0, fov: 0, aspect: 0 } };
    const onHeadingChange = jest.fn();
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(10_000);
    mockCamera.getWorldDirection = jest.fn((target: THREE.Vector3) =>
      target.set(0, 0, -1),
    );

    render(
      <EditorRenderer
        focusRef={focusRef}
        cameraStateRef={cameraStateRef}
        focusTarget={{ x: 100, y: 200, token: 1, distanceMeters: 500 }}
        onHeadingChange={onHeadingChange}
      />,
    );

    expect(mockControls.target.x).toBe(100);
    expect(mockControls.target.z).toBe(200);
    expect(mockControls.update).toHaveBeenCalled();
    expect(focusRef.current).toEqual({ x: 100, y: 200 });

    runFrames();
    expect(cameraStateRef.current.y).toBeCloseTo(mockCamera.position.y);
    expect(onHeadingChange).toHaveBeenCalled();

    nowSpy.mockRestore();
  });
});
