import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '@react-three/fiber';

type MockTextureShape = {
  wrapS: unknown;
  wrapT: unknown;
  repeat: { set: jest.Mock };
  dispose: jest.Mock;
};

type MockGeometryShape = {
  width: number;
  height: number;
  dispose: jest.Mock;
};

type MockMaterialShape = {
  uniforms: { uTime: { value: number } };
  dispose: jest.Mock;
};

const testGlobals = globalThis as typeof globalThis & {
  __lastTexture?: MockTextureShape;
  __lastGeometry?: MockGeometryShape;
  __lastShaderMaterial?: MockMaterialShape;
};

jest.mock('../../../../src/components/Ocean/shaders/caustics.vert', () => '', {
  virtual: true,
});

jest.mock('../../../../src/components/Ocean/shaders/caustics.frag', () => '', {
  virtual: true,
});

jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
}));

jest.mock('three', () => {
  class MockTexture {
    wrapS: unknown = null;
    wrapT: unknown = null;
    repeat = { set: jest.fn() };
    dispose = jest.fn();
  }

  class MockTextureLoader {
    load() {
      const tex = new MockTexture();
      testGlobals.__lastTexture = tex;
      return tex;
    }
  }

  class MockPlaneGeometry {
    dispose = jest.fn();
    constructor(
      public width: number,
      public height: number,
    ) {
      testGlobals.__lastGeometry = this;
    }
  }

  class MockShaderMaterial {
    dispose = jest.fn();
    uniforms: { uTime: { value: number } };
    constructor(params: { uniforms: { uTime: { value: number } } }) {
      this.uniforms = params.uniforms;
      testGlobals.__lastShaderMaterial = this;
    }
  }

  class MockColor {
    constructor(public value: unknown) {}
  }

  return {
    TextureLoader: MockTextureLoader,
    PlaneGeometry: MockPlaneGeometry,
    ShaderMaterial: MockShaderMaterial,
    Color: MockColor,
    RepeatWrapping: 'RepeatWrapping',
  };
});

import OceanFloor from '../../../../src/components/Ocean/OceanFloor';

describe('OceanFloor', () => {
  it('initializes texture, geometry, material and cleans up', () => {
    (useFrame as jest.Mock).mockImplementation(() => undefined);

    const { unmount } = render(<OceanFloor size={50} />);

    const texture = testGlobals.__lastTexture!;
    const geometry = testGlobals.__lastGeometry!;
    const material = testGlobals.__lastShaderMaterial!;

    expect(texture).toBeTruthy();
    expect(texture.repeat.set).toHaveBeenCalledWith(100, 100);
    expect(texture.wrapS).toBe('RepeatWrapping');
    expect(texture.wrapT).toBe('RepeatWrapping');

    expect(geometry.width).toBe(50);
    expect(geometry.height).toBe(50);

    expect(material.uniforms.uTime.value).toBe(0);

    unmount();
    expect(texture.dispose).toHaveBeenCalled();
    expect(geometry.dispose).toHaveBeenCalled();
    expect(material.dispose).toHaveBeenCalled();
  });
});
