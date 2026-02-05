import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { EcdisDisplay } from '../../../../src/components/navigation/EcdisDisplay';

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
  }

  class MockObject3D {
    position = new MockVector3();
    rotation = new MockVector3();
    userData: Record<string, any> = {};
  }

  class MockScene {
    children: any[] = [];
    add(obj: any) {
      this.children.push(obj);
    }
    remove(obj: any) {
      this.children = this.children.filter(child => child !== obj);
    }
    clear() {
      this.children = [];
    }
  }

  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    setClearColor = jest.fn();
    setSize = jest.fn();
    render = jest.fn();
    dispose = jest.fn();
    constructor() {
      this.domElement.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        right: 500,
        bottom: 500,
      });
    }
  }

  class MockOrthographicCamera {
    position = new MockVector3();
    zoom = 1;
    updateProjectionMatrix = jest.fn();
    lookAt = jest.fn();
  }

  class MockBufferGeometry {
    attributes: any = {
      position: { array: new Float32Array(9) },
    };
    setFromPoints = jest.fn(() => this);
    setAttribute = jest.fn();
    getAttribute = jest.fn(() => ({
      count: 3,
      getX: () => 0,
      getY: () => 0,
      getZ: () => 0,
    }));
  }

  class MockCircleGeometry extends MockBufferGeometry {}
  class MockPlaneGeometry extends MockBufferGeometry {}
  class MockShape {
    moveTo = jest.fn();
    lineTo = jest.fn();
  }
  class MockShapeGeometry extends MockBufferGeometry {}

  class MockMesh extends MockObject3D {
    constructor(
      public geometry: any,
      public material: any,
    ) {
      super();
    }
  }

  class MockLine extends MockMesh {
    computeLineDistances = jest.fn();
  }

  class MockLineLoop extends MockLine {}

  class MockMeshBasicMaterial {
    constructor(public params: any) {}
  }
  class MockLineBasicMaterial {
    constructor(public params: any) {}
  }
  class MockLineDashedMaterial {
    constructor(public params: any) {}
  }
  class MockFloat32BufferAttribute {
    constructor(
      public array: number[],
      public itemSize: number,
    ) {}
  }

  const MathUtils = {
    degToRad: (deg: number) => (deg * Math.PI) / 180,
  };

  return {
    Vector2: MockVector2,
    Vector3: MockVector3,
    Scene: MockScene,
    WebGLRenderer: MockWebGLRenderer,
    OrthographicCamera: MockOrthographicCamera,
    BufferGeometry: MockBufferGeometry,
    CircleGeometry: MockCircleGeometry,
    PlaneGeometry: MockPlaneGeometry,
    Shape: MockShape,
    ShapeGeometry: MockShapeGeometry,
    Mesh: MockMesh,
    Line: MockLine,
    LineLoop: MockLineLoop,
    MeshBasicMaterial: MockMeshBasicMaterial,
    LineBasicMaterial: MockLineBasicMaterial,
    LineDashedMaterial: MockLineDashedMaterial,
    Float32BufferAttribute: MockFloat32BufferAttribute,
    MathUtils,
  };
});

describe('EcdisDisplay', () => {
  beforeEach(() => {
    (globalThis as any).requestAnimationFrame = jest.fn(() => 1);
    (globalThis as any).cancelAnimationFrame = jest.fn();
  });

  it('renders controls and supports search + measurement mode', () => {
    render(
      <EcdisDisplay
        aisTargets={[
          {
            lat: 60.18,
            lon: 24.99,
            name: 'Target Alpha',
            mmsi: '123',
            heading: 90,
            speed: 12,
          },
        ]}
        chartData={{
          coastline: [
            [24.93, 60.16],
            [24.95, 60.17],
          ],
          buoys: [{ latitude: 60.165, longitude: 24.96, type: 'starboard' }],
        }}
      />,
    );

    expect(screen.getByText('ECDIS')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search waypoint, buoy, AIS...'),
    ).toBeInTheDocument();

    const measurementToggle = screen.getByLabelText('Measurement Tool');
    fireEvent.click(measurementToggle);
    expect(
      screen.getByText(/Click and drag to measure distance\/bearing/i),
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Search waypoint, buoy, AIS...',
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'waypoint #1' } });
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByText(/Found waypoint #1/i)).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'starboard' } });
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByText(/Found buoy #1/i)).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'alpha' } });
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByText(/Found ais #1/i)).toBeInTheDocument();
  });

  it('allows adjusting chart layer controls', () => {
    const { container } = render(<EcdisDisplay />);

    const rangeInputs = container.querySelectorAll(
      'input[type="range"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(rangeInputs.length).toBeGreaterThan(0);
    fireEvent.change(rangeInputs[0], { target: { value: '0.5' } });

    const upButtons = Array.from(container.querySelectorAll('button')).filter(
      button => button.textContent === '↑',
    );
    const downButtons = Array.from(container.querySelectorAll('button')).filter(
      button => button.textContent === '↓',
    );
    if (upButtons[0]) fireEvent.click(upButtons[0]);
    if (downButtons[0]) fireEvent.click(downButtons[0]);
  });
});
