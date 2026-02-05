import React from 'react';
import { render } from '@testing-library/react';
import Precipitation from '../../../src/components/Precipitation';

jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
}));

describe('Precipitation', () => {
  const originalRaf = window.requestAnimationFrame;
  const originalCaf = window.cancelAnimationFrame;

  beforeEach(() => {
    window.requestAnimationFrame = jest.fn().mockReturnValue(1);
    window.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCaf;
  });

  it('returns null for none or zero intensity', () => {
    const { container: noneContainer } = render(
      <Precipitation type="none" intensity={1} />,
    );
    expect(noneContainer.firstChild).toBeNull();

    const { container: zeroContainer } = render(
      <Precipitation type="rain" intensity={0} />,
    );
    expect(zeroContainer.firstChild).toBeNull();
  });

  it('renders rain as line segments', () => {
    const { container } = render(
      <Precipitation type="rain" intensity={0.4} inCanvas={false} />,
    );

    expect(container.querySelector('linesegments')).toBeTruthy();
  });

  it('renders snow and fog as points', () => {
    const { container: snowContainer } = render(
      <Precipitation type="snow" intensity={0.6} inCanvas={false} />,
    );
    expect(snowContainer.querySelector('points')).toBeTruthy();

    const { container: fogContainer } = render(
      <Precipitation type="fog" intensity={0.2} inCanvas={false} />,
    );
    expect(fogContainer.querySelector('points')).toBeTruthy();
  });
});
