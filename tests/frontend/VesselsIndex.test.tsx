import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import VesselListPage from '../../src/pages/vessels/index';

const mockFetch = jest.fn();

jest.mock('../../src/lib/api', () => ({
  getApiBase: () => '',
}));

describe('Vessel list page', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('renders vessels and filters by search query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'vessel-1', spaceId: 'global', ownerId: 'owner-a' },
        { id: 'vessel-2', spaceId: 'harbor', ownerId: 'owner-b' },
      ],
    });

    render(<VesselListPage />);

    expect(await screen.findByText('vessel-1')).toBeInTheDocument();
    expect(screen.getByText('vessel-2')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('ID, space, or owner'), {
      target: { value: 'harbor' },
    });

    await waitFor(() => {
      expect(screen.queryByText('vessel-1')).not.toBeInTheDocument();
      expect(screen.getByText('vessel-2')).toBeInTheDocument();
    });
  });
});
