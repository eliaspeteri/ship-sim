import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import * as THREE from 'three';
import Ship from '../../../src/components/Ship';
import useStore from '../../../src/store';
import {
  getCompositeWaveSample,
  getGerstnerSample,
} from '../../../src/lib/waves';

jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
}));

jest.mock('@react-three/drei', () => ({
  useGLTF: jest.fn(() => ({ scene: new THREE.Group() })),
  Detailed: ({ children }: { children: React.ReactNode }) => (
    <group>{children}</group>
  ),
}));

jest.mock('../../../src/lib/waves', () => ({
  getCompositeWaveSample: jest.fn(),
  getGerstnerSample: jest.fn(),
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useRef: jest.fn((initial: any) => {
      if (initial === null) {
        const positionSet = jest.fn();
        const rotationSet = jest.fn();
        const ref = {
          current: {
            position: { set: positionSet },
            rotation: { set: rotationSet },
          },
        };
        (globalThis as any).__shipRef = ref;
        return ref;
      }
      return actual.useRef(initial);
    }),
    default: actual,
  };
});

jest.mock('../../../src/store');

const useStoreMock = useStore as jest.MockedFunction<any>;

describe('Ship', () => {
  beforeEach(() => {
    useStoreMock.mockImplementation(selector =>
      selector({
        vessel: { orientation: { roll: 0.1, pitch: -0.05 } },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSelect when the group is clicked', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <Ship
        vesselId="v-1"
        position={{ x: 0, y: 0, z: 0 }}
        heading={0}
        onSelect={onSelect}
      />,
    );

    const group = container.querySelector('group') as HTMLElement;
    fireEvent.pointerDown(group);
    expect(onSelect).toHaveBeenCalledWith('v-1');
  });

  it('renders debug markers when enabled', () => {
    const { container } = render(
      <Ship position={{ x: 0, y: 0, z: 0 }} heading={0} showDebugMarkers />,
    );

    expect(container.querySelectorAll('mesh').length).toBe(4);
  });

  it('renders model primitives when a model path is provided', async () => {
    const { container } = render(
      <Ship
        position={{ x: 0, y: 0, z: 0 }}
        heading={0}
        modelPath="/models/mock.glb"
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('primitive').length).toBe(2);
    });
  });

  it('updates position and rotation on frame with waves and horizon occlusion', () => {
    (getCompositeWaveSample as jest.Mock).mockReturnValue({ height: 5 });
    (getGerstnerSample as jest.Mock).mockReturnValue({ height: 2 });

    const waveTimeRef = { current: 2 };
    render(
      <Ship
        position={{ x: 5000, y: 0, z: 0 }}
        heading={1}
        roll={0.2}
        pitch={0.3}
        renderOptions={{ modelYawDeg: 10, sinkFactor: 0 }}
        draft={0}
        ballast={0}
        wave={{
          amplitude: 1,
          wavelength: 2,
          direction: 45,
          steepness: 0.5,
          speed: 3,
          k: 0.1,
          omega: 0.2,
        }}
        waveTimeRef={waveTimeRef as any}
        horizonOcclusion={{ enabled: true }}
      />,
    );

    const shipRef = (globalThis as any).__shipRef;
    shipRef.current = {
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
    };

    const { useFrame } = jest.requireMock('@react-three/fiber') as {
      useFrame: jest.Mock;
    };
    const frameCb = useFrame.mock.calls[0][0];
    frameCb({ camera: { position: new THREE.Vector3(0, 100, 0) } }, 0.016);

    const expectedRawDrop = (5000 * 5000) / (2 * 6_371_000);
    const expectedDrop = expectedRawDrop * 0.4;
    const [x, y, z] = (shipRef.current.position.set as jest.Mock).mock.calls[0];
    expect(x).toBe(5000);
    expect(z).toBe(0);
    expect(y).toBeCloseTo(3 - expectedDrop, 5);

    const modelYaw = (10 * Math.PI) / 180;
    const expectedHeading = Math.PI / 2 - 1 + modelYaw;
    expect(shipRef.current.rotation.set).toHaveBeenCalledWith(
      0.3,
      expectedHeading,
      0.2,
    );
  });

  it('falls back to store orientation when roll/pitch props are unset', () => {
    render(<Ship position={{ x: 0, y: 1, z: 2 }} heading={0} />);

    const shipRef = (globalThis as any).__shipRef;
    shipRef.current = {
      position: { set: jest.fn() },
      rotation: { set: jest.fn() },
    };

    const { useFrame } = jest.requireMock('@react-three/fiber') as {
      useFrame: jest.Mock;
    };
    const frameCb = useFrame.mock.calls[0][0];
    frameCb({ camera: { position: new THREE.Vector3(0, 5, 0) } }, 0.016);

    expect(shipRef.current.rotation.set).toHaveBeenCalledWith(
      -0.05,
      Math.PI / 2,
      0.1,
    );
  });
});
