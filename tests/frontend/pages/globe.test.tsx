import { render, screen } from '@testing-library/react';
import React from 'react';

import GlobePage from '../../../src/pages/globe';

const useTextureMock = jest.fn();

jest.mock('@react-three/fiber', () => {
  return {
    Canvas: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="globe-canvas">{children}</div>
    ),
    useFrame: (_callback: (_state: unknown, delta: number) => void) => {},
  };
});

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  useTexture: (...args: unknown[]) => useTextureMock(...args),
}));

jest.mock('../../../src/lib/majorCities', () => ({
  majorCities: [
    { lat: 60.17, lon: 24.94 },
    { lat: 59.33, lon: 18.06 },
  ],
}));

describe('pages/globe', () => {
  beforeEach(() => {
    useTextureMock.mockReset();
    useTextureMock.mockReturnValue([{}, {}]);
  });

  it('renders globe canvas and controls and enables full-bleed layout', () => {
    const { container } = render(<GlobePage />);

    expect(screen.getByTestId('globe-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(container.querySelectorAll('mesh').length).toBeGreaterThanOrEqual(3);
    expect(GlobePage.fullBleedLayout).toBe(true);
  });
});
