import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { EcdisDisplay } from '../../../../src/components/navigation/ecdis/EcdisDisplay';

jest.mock('three', () => {
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
      return obj;
    }
    clear() {
      this.children = [];
    }
  }

  class MockGroup extends MockObject3D {
    children: any[] = [];
    add(obj: any) {
      this.children.push(obj);
      return obj;
    }
  }

  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    setClearColor = jest.fn();
    setPixelRatio = jest.fn();
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
    left = -1;
    right = 1;
    top = 1;
    bottom = -1;
    updateProjectionMatrix = jest.fn();
    lookAt = jest.fn();
  }

  class MockBufferGeometry {
    setFromPoints = jest.fn(() => this);
  }

  class MockCircleGeometry extends MockBufferGeometry {}
  class MockShape {
    moveTo = jest.fn();
    lineTo = jest.fn();
    absarc = jest.fn();
    getPoints = jest.fn(() => [{ x: 0, y: 0 }]);
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

  const MathUtils = {
    degToRad: (deg: number) => (deg * Math.PI) / 180,
  };

  return {
    Vector3: MockVector3,
    Scene: MockScene,
    Group: MockGroup,
    WebGLRenderer: MockWebGLRenderer,
    OrthographicCamera: MockOrthographicCamera,
    BufferGeometry: MockBufferGeometry,
    CircleGeometry: MockCircleGeometry,
    Shape: MockShape,
    ShapeGeometry: MockShapeGeometry,
    Mesh: MockMesh,
    Line: MockLine,
    LineLoop: MockLineLoop,
    MeshBasicMaterial: MockMeshBasicMaterial,
    LineBasicMaterial: MockLineBasicMaterial,
    LineDashedMaterial: MockLineDashedMaterial,
    MathUtils,
  };
});

describe('EcdisDisplay', () => {
  beforeEach(() => {
    class MockResizeObserver {
      cb: ResizeObserverCallback;

      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }

      observe = jest.fn((target: Element) => {
        this.cb(
          [
            {
              target,
              contentRect: {
                width: 500,
                height: 500,
                x: 0,
                y: 0,
                top: 0,
                right: 500,
                bottom: 500,
                left: 0,
                toJSON: () => ({}),
              },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      });

      disconnect = jest.fn();
      unobserve = jest.fn();
    }

    (globalThis as any).ResizeObserver = MockResizeObserver;
  });

  it('renders ECDIS panel and labels', () => {
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

    expect(screen.getByText('KELVIN HUGHES ECDIS')).toBeInTheDocument();
    expect(screen.getByText('TRACK CONTROL')).toBeInTheDocument();
    expect(screen.getByText('Select Query Feature')).toBeInTheDocument();
    expect(screen.getByText(/Cursor:/i)).toBeInTheDocument();
  });

  it('updates cursor readout on pointer move', () => {
    const { container } = render(<EcdisDisplay />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();

    expect(screen.getByText(/Cursor:\s*--/i)).toBeInTheDocument();
    fireEvent.pointerMove(window, { clientX: 250, clientY: 250 });
    expect(screen.queryByText(/Cursor:\s*--/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Cursor:/i)).toBeInTheDocument();
  });

  it('supports pan and zoom interactions', () => {
    const { container } = render(<EcdisDisplay />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();

    fireEvent.pointerDown(canvas, { clientX: 240, clientY: 220 });
    fireEvent.pointerMove(window, { clientX: 270, clientY: 260 });
    fireEvent.pointerUp(window);
    fireEvent.wheel(canvas, { deltaY: -120 });
    fireEvent.pointerLeave(canvas);

    expect(screen.getByText(/Cursor:/i)).toBeInTheDocument();
  });
});
