import earcut from 'earcut';

import { latLonToXY } from '../../../../src/lib/geo';
import { fetchLandTileMesh } from '../../../../src/lib/tiles/mvtLandMesh';

type MockGeometry = {
  setAttribute: jest.Mock;
  setIndex: jest.Mock;
  computeVertexNormals: jest.Mock;
};

type MockMaterial = {
  params: { color?: string };
};

let tileLayers: Record<string, unknown> = {};
let lastGeometry: MockGeometry | null = null;
let lastMaterial: MockMaterial | null = null;

const captureGeometry = (instance: MockGeometry) => {
  lastGeometry = instance;
};

const captureMaterial = (instance: MockMaterial) => {
  lastMaterial = instance;
};

jest.mock('pbf', () =>
  jest.fn().mockImplementation(() => ({
    __pbf: true,
  })),
);

jest.mock('@mapbox/vector-tile', () => ({
  VectorTile: jest.fn().mockImplementation(() => ({
    layers: tileLayers,
  })),
}));

jest.mock('earcut', () => jest.fn(() => [0, 1, 2]));

jest.mock('../../../../src/lib/geo', () => ({
  latLonToXY: jest.fn(() => ({ x: 10, y: 20 })),
}));

jest.mock('three', () => {
  class BufferGeometry {
    constructor() {
      captureGeometry(this);
    }
    setAttribute = jest.fn();
    setIndex = jest.fn();
    computeVertexNormals = jest.fn();
  }
  class Float32BufferAttribute {
    array: number[];
    itemSize: number;
    constructor(array: number[], itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
    }
  }
  class MeshStandardMaterial {
    params: { color?: string };
    constructor(params: { color?: string }) {
      this.params = params;
      captureMaterial(this);
    }
  }
  class Mesh {
    geometry: unknown;
    material: unknown;
    frustumCulled = false;
    name = '';
    constructor(geometry: unknown, material: unknown) {
      this.geometry = geometry;
      this.material = material;
    }
  }
  return {
    BufferGeometry,
    Float32BufferAttribute,
    MeshStandardMaterial,
    Mesh,
    DoubleSide: 'DoubleSide',
  };
});

describe('fetchLandTileMesh', () => {
  beforeEach(() => {
    tileLayers = {};
    lastGeometry = null;
    lastMaterial = null;
    (latLonToXY as jest.Mock).mockClear();
    (earcut as jest.Mock).mockClear();
  });

  it('returns null when land tile fetch fails', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
    })) as unknown as typeof fetch;

    const mesh = await fetchLandTileMesh({ z: 1, x: 2, y: 3 });
    expect(mesh).toBeNull();
  });

  it('returns null when no land layer exists', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;
    tileLayers = {};

    const mesh = await fetchLandTileMesh({ z: 1, x: 2, y: 3 });
    expect(mesh).toBeNull();
  });

  it('builds a mesh from land features without terrain sampling', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;

    const ring = [
      { x: 0, y: 0 },
      { x: 2048, y: 0 },
      { x: 2048, y: 2048 },
    ];
    tileLayers = {
      land: {
        length: 1,
        extent: 4096,
        feature: () => ({
          loadGeometry: () => [ring],
        }),
      },
    };

    const mesh = await fetchLandTileMesh({
      z: 4,
      x: 5,
      y: 6,
      landY: 1,
      heightScale: 2,
      seaLevel: 0,
      useTerrain: false,
    });

    expect(mesh).toBeTruthy();
    expect(mesh?.name).toBe('land_4_5_6');
    expect(mesh?.frustumCulled).toBe(true);

    expect(latLonToXY).toHaveBeenCalled();
    expect(earcut).toHaveBeenCalled();

    const positionAttr = lastGeometry?.setAttribute.mock.calls[0][1] as {
      array: number[];
    };
    expect(positionAttr.array.length).toBe(9);
    expect(lastGeometry?.setIndex).toHaveBeenCalledWith([0, 1, 2]);
    expect(lastMaterial?.params.color).toBe('hotpink');
  });
});
