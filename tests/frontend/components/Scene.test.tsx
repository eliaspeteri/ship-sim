import React from 'react';
import * as THREE from 'three';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Scene from '../../../src/components/Scene';
import useStore from '../../../src/store';
import { socketManager } from '../../../src/networking/socket';

let lastCalloutProps: any = null;
let lastCameraHeadingProps: any = null;

jest.mock('@react-three/fiber', () => {
  const THREE = jest.requireActual('three');
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000);
  camera.position.set(0, 200, 200);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.updateMatrixWorld();
  return {
    Canvas: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="canvas">{children}</div>
    ),
    useFrame: jest.fn(),
    useThree: () => ({
      camera,
      gl: {
        domElement: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
          }),
        },
      },
    }),
  };
});

jest.mock('@react-three/drei', () => {
  const React = require('react');
  const THREE = jest.requireActual('three');
  const EnvironmentMock = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="environment">{children}</div>
  );
  EnvironmentMock.displayName = 'EnvironmentMock';

  const OrbitControlsMock = React.forwardRef((_props: any, ref: any) => {
    if (ref) {
      ref.current = {
        target: { set: jest.fn() },
        update: jest.fn(),
      };
    }
    return <div data-testid="orbit-controls" />;
  });
  OrbitControlsMock.displayName = 'OrbitControlsMock';

  const SkyMock = () => <div data-testid="sky" />;
  SkyMock.displayName = 'SkyMock';
  return {
    Environment: EnvironmentMock,
    OrbitControls: OrbitControlsMock,
    Sky: SkyMock,
    useGLTF: jest.fn(() => ({ scene: new THREE.Group() })),
  };
});

jest.mock('../../../src/store');

jest.mock('../../../src/networking/socket', () => ({
  socketManager: {
    sendAdminVesselMove: jest.fn(),
    sendAdminVesselStop: jest.fn(),
    sendAdminVesselMode: jest.fn(),
    sendAdminVesselRemove: jest.fn(),
    sendClientLog: jest.fn(),
  },
}));

jest.mock('../../../src/components/Ship', () => {
  const MockShip = (props: any) => (
    <button
      data-testid={`ship-${props.vesselId ?? 'self'}`}
      onClick={() => props.onSelect?.(props.vesselId)}
      type="button"
    >
      Ship
    </button>
  );
  MockShip.displayName = 'MockShip';
  return MockShip;
});

jest.mock('../../../src/components/VesselCallout', () => {
  const MockVesselCallout = (props: any) => {
    lastCalloutProps = props;
    return (
      <div data-testid="callout">
        <div>{props.title}</div>
        {props.actions?.map((action: any) => (
          <button key={action.label} onClick={action.onClick} type="button">
            {action.label}
          </button>
        ))}
      </div>
    );
  };
  MockVesselCallout.displayName = 'MockVesselCallout';
  return MockVesselCallout;
});

jest.mock('../../../src/components/OceanPatch', () => {
  const OceanPatchMock = () => <div data-testid="ocean-patch" />;
  OceanPatchMock.displayName = 'OceanPatchMock';
  return { OceanPatch: OceanPatchMock };
});

jest.mock('../../../src/components/FarWater', () => {
  const FarWaterMock = () => <div data-testid="far-water" />;
  FarWaterMock.displayName = 'FarWaterMock';
  return { FarWater: FarWaterMock };
});

jest.mock('../../../src/components/SeamarkSprites', () => {
  const SeamarkSpritesMock = () => <div data-testid="seamark-sprites" />;
  SeamarkSpritesMock.displayName = 'SeamarkSpritesMock';
  return SeamarkSpritesMock;
});

jest.mock('../../../src/components/LandTiles', () => {
  const LandTilesMock = () => <div data-testid="land-tiles" />;
  LandTilesMock.displayName = 'LandTilesMock';
  return { LandTiles: LandTilesMock };
});

jest.mock('../../../src/components/CameraHeadingIndicator', () => {
  const CameraHeadingIndicatorMock = (props: any) => {
    lastCameraHeadingProps = props;
    return (
      <div
        data-testid="camera-heading"
        data-enabled={props.enabled ? 'true' : 'false'}
      />
    );
  };
  CameraHeadingIndicatorMock.displayName = 'CameraHeadingIndicatorMock';
  return CameraHeadingIndicatorMock;
});

const useStoreMock = useStore as jest.MockedFunction<any>;

const buildState = (overrides: Record<string, any> = {}) => ({
  vessel: {
    position: { x: 120, y: 240, z: -2 },
    orientation: { heading: Math.PI / 2, roll: 0.01, pitch: -0.02 },
    velocity: { surge: 2, sway: 0 },
    controls: { ballast: 0.5 },
    properties: {
      name: 'Self',
      length: 60,
      beam: 10,
      draft: 4,
      type: 'cargo',
      modelPath: null,
    },
    render: {},
    waterDepth: 12,
  },
  otherVessels: {
    'v-2': {
      position: { x: 300, y: 400, z: -3 },
      orientation: { heading: 0.5 },
      velocity: { surge: 1.4, sway: 0 },
      controls: { ballast: 0.4 },
      properties: {
        name: 'Seadragon',
        length: 50,
        beam: 9,
        draft: 3,
        type: 'cargo',
        modelPath: null,
      },
      render: {},
      mode: 'player',
      waterDepth: 15,
    },
  },
  crewIds: ['c1', 'c2', 'c3'],
  environment: {
    timeOfDay: 16,
    seaState: 3,
    wind: { speed: 9.7, direction: 0.61 },
  },
  replay: { playing: false, frames: [] },
  stopReplayPlayback: jest.fn(),
  roles: ['admin'],
  currentVesselId: 'self',
  seamarks: { features: [] },
  ...overrides,
});

describe('Scene', () => {
  beforeEach(() => {
    lastCalloutProps = null;
    lastCameraHeadingProps = null;
  });

  it('renders callout and admin actions for selected vessel in spectator mode', async () => {
    const state = buildState();
    type StoreState = typeof state;
    useStoreMock.mockImplementation(
      (selector: (storeState: StoreState) => unknown) => selector(state),
    );

    render(
      <Scene
        vesselPosition={{ x: 120, y: 240, z: -2, heading: 0 }}
        mode="spectator"
      />,
    );

    fireEvent.click(screen.getByTestId('ship-v-2'));

    await waitFor(() => {
      expect(screen.getByTestId('callout')).toBeInTheDocument();
    });

    expect(lastCalloutProps.title).toBe('Seadragon');
    expect(lastCalloutProps.rows.length).toBeGreaterThan(5);
    expect(lastCalloutProps.rows[0].label).toBe('Speed');

    fireEvent.click(screen.getByRole('button', { name: 'Force AI' }));
    expect(socketManager.sendAdminVesselMode).toHaveBeenCalledWith('v-2', 'ai');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(socketManager.sendAdminVesselRemove).toHaveBeenCalledWith('v-2');

    expect(lastCameraHeadingProps.enabled).toBe(true);
  });

  it('does not expose admin actions in player mode', async () => {
    const state = buildState({ roles: [], otherVessels: {} });
    type StoreState = typeof state;
    useStoreMock.mockImplementation(
      (selector: (storeState: StoreState) => unknown) => selector(state),
    );

    render(
      <Scene
        vesselPosition={{ x: 120, y: 240, z: -2, heading: 0 }}
        mode="player"
      />,
    );

    fireEvent.click(screen.getByTestId('ship-self'));

    await waitFor(() => {
      expect(screen.queryByTestId('callout')).toBeNull();
    });

    expect(lastCameraHeadingProps.enabled).toBe(false);
  });

  it('updates drag previews and hud offset in spectator admin mode', async () => {
    const intersectSpy = jest
      .spyOn(THREE.Ray.prototype, 'intersectPlane')
      .mockImplementation((_plane, target) => {
        const point = target ?? new THREE.Vector3();
        point.set(10, 0, 12);
        return point;
      });

    const footer = document.createElement('div');
    footer.setAttribute('data-hud-footer', 'true');
    footer.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 42,
        right: 100,
        bottom: 42,
      }) as DOMRect;
    document.body.appendChild(footer);

    const state = buildState();
    type StoreState = typeof state;
    useStoreMock.mockImplementation(
      (selector: (storeState: StoreState) => unknown) => selector(state),
    );

    const { container } = render(
      <Scene
        vesselPosition={{ x: 120, y: 240, z: -2, heading: 0 }}
        mode="spectator"
      />,
    );

    await waitFor(() => {
      expect(lastCameraHeadingProps?.hudOffset).toBe(42);
    });

    const mesh = container.querySelector('mesh');
    expect(mesh).toBeTruthy();

    fireEvent.pointerDown(mesh as Element, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 60,
      clientY: 60,
    });
    fireEvent.pointerUp(window, {
      pointerId: 1,
      clientX: 60,
      clientY: 60,
    });

    expect(socketManager.sendAdminVesselMove).toHaveBeenCalled();

    document.body.removeChild(footer);
    intersectSpy.mockRestore();
  });
});
