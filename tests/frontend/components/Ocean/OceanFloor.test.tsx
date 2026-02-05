import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '@react-three/fiber';

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
    wrapS: any = null;
    wrapT: any = null;
    repeat = { set: jest.fn() };
    dispose = jest.fn();
  }

  class MockTextureLoader {
    load() {
      const tex = new MockTexture();
      (globalThis as any).__lastTexture = tex;
      return tex;
    }
  }

  class MockPlaneGeometry {
    dispose = jest.fn();
    constructor(
      public width: number,
      public height: number,
    ) {
      (globalThis as any).__lastGeometry = this;
    }
  }

  class MockShaderMaterial {
    dispose = jest.fn();
    uniforms: any;
    constructor(params: any) {
      this.uniforms = params.uniforms;
      (globalThis as any).__lastShaderMaterial = this;
    }
  }

  class MockColor {
    constructor(public value: any) {}
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

    const texture = (globalThis as any).__lastTexture;
    const geometry = (globalThis as any).__lastGeometry;
    const material = (globalThis as any).__lastShaderMaterial;

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
