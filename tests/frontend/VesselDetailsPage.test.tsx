import { render, screen } from '@testing-library/react';
import React from 'react';

import VesselDetailsPage from '../../src/pages/vessels/[id]';

const mockFetch = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'vessel-42' },
  }),
}));

jest.mock('../../src/lib/api', () => ({
  getApiBase: () => '',
}));

describe('Vessel details page', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('renders vessel details without auth gating', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        vessel: {
          id: 'vessel-42',
          spaceId: 'global',
          ownerId: 'owner-1',
          mode: 'player',
          desiredMode: null,
          lastCrewAt: null,
          lastUpdate: null,
          position: { lat: 10, lon: 20, z: -5 },
          orientation: { heading: 0, roll: 0, pitch: 0 },
          velocity: { surge: 0, sway: 0, heave: 0 },
          controls: { throttle: 0.1, rudderAngle: 0, ballast: 0.5 },
          properties: { mass: 1000, length: 10, beam: 4, draft: 2 },
          yawRate: 0,
          isAi: false,
        },
      }),
    });

    render(<VesselDetailsPage />);

    expect(await screen.findByText('Vessel vessel-42')).toBeInTheDocument();
    expect(await screen.findByText('Space global')).toBeInTheDocument();
    expect(await screen.findByText('AI traffic no')).toBeInTheDocument();
  });
});
