import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';

import SpacesPage from '../../../src/pages/spaces';

const useSessionMock = jest.fn();
const getApiBaseMock = jest.fn(() => 'http://api.test');

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: () => getApiBaseMock(),
}));

describe('pages/spaces', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    getApiBaseMock.mockReset();
    getApiBaseMock.mockReturnValue('http://api.test');
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'prompt').mockReturnValue('DELETE');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading and unauthenticated states', () => {
    useSessionMock.mockReturnValue({ status: 'loading', data: null });
    const { unmount } = render(<SpacesPage />);
    expect(screen.getByText('Loading your spaces…')).toBeInTheDocument();

    unmount();
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });
    render(<SpacesPage />);
    expect(screen.getByText('Manage spaces')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to view and manage your spaces.'),
    ).toBeInTheDocument();
  });

  it('loads spaces and handles save/invite/password/delete actions', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'admin-1', role: 'admin' } },
    });
    const fetchMock = globalThis.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url.startsWith('http://api.test/api/spaces/manage')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            spaces: [
              {
                id: 'space-1',
                name: 'Harbor Ops',
                visibility: 'private',
                inviteToken: 'invite-123',
                createdBy: 'admin-1',
                passwordProtected: true,
                totalVessels: 0,
                activeVessels: 0,
                rulesetType: 'CASUAL',
                rules: null,
              },
              {
                id: 'space-2',
                name: 'Busy Space',
                visibility: 'public',
                inviteToken: 'invite-456',
                createdBy: 'admin-2',
                totalVessels: 2,
                activeVessels: 1,
                rulesetType: 'REALISM',
                rules: null,
              },
            ],
          }),
        });
      }
      if (url === 'http://api.test/api/spaces/space-1' && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'space-1', name: 'Harbor Ops Updated' }),
        });
      }
      if (url === 'http://api.test/api/spaces/space-1' && method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });

    render(<SpacesPage />);
    await screen.findByDisplayValue('Harbor Ops');
    expect(screen.getByDisplayValue('Busy Space')).toBeInTheDocument();
    const getSpaceOneCard = () => {
      const card = screen.queryByTestId('space-card-space-1');
      if (!card) {
        throw new Error('space-1 card not found');
      }
      return card as HTMLElement;
    };

    fireEvent.click(screen.getByRole('button', { name: 'All spaces' }));
    await waitFor(() => {
      expect(screen.queryByText('Loading spaces…')).not.toBeInTheDocument();
    });

    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', {
        name: 'Customize rules',
      }),
    );
    expect(screen.getByLabelText('Allowed vessels')).toBeInTheDocument();
    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', {
        name: 'Clear overrides',
      }),
    );
    expect(
      within(getSpaceOneCard()).getByRole('button', {
        name: 'Customize rules',
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', {
        name: 'Customize rules',
      }),
    );

    fireEvent.change(within(getSpaceOneCard()).getByLabelText('Name'), {
      target: { value: 'Harbor Ops Updated' },
    });
    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', { name: 'Copy token' }),
    );
    expect(screen.getByText('Invite token copied.')).toBeInTheDocument();
    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', { name: 'Save changes' }),
    );

    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          url === 'http://api.test/api/spaces/space-1' &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patchCalls.length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(
        within(getSpaceOneCard()).getByRole('button', {
          name: 'Regenerate invite',
        }),
      ).toBeEnabled();
    });

    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', {
        name: 'Regenerate invite',
      }),
    );
    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          url === 'http://api.test/api/spaces/space-1' &&
          (init as RequestInit | undefined)?.method === 'PATCH' &&
          String((init as RequestInit | undefined)?.body || '').includes(
            'regenerateInvite',
          ),
      );
      expect(patchCalls.length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(
        within(getSpaceOneCard()).getByRole('button', {
          name: 'Clear password',
        }),
      ).toBeEnabled();
    });

    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', { name: 'Clear password' }),
    );
    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          url === 'http://api.test/api/spaces/space-1' &&
          (init as RequestInit | undefined)?.method === 'PATCH' &&
          String((init as RequestInit | undefined)?.body || '').includes(
            'clearPassword',
          ),
      );
      expect(patchCalls.length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText('Delete is disabled while vessels exist in this space.'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        within(getSpaceOneCard()).getByRole('button', { name: 'Delete' }),
      ).toBeEnabled();
    });
    fireEvent.click(
      within(getSpaceOneCard()).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/spaces/space-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  it('shows load error, supports refresh, and renders empty-state notice', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'user-1', role: 'player' } },
    });
    const fetchMock = globalThis.fetch as unknown as jest.Mock;
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ spaces: [] }),
      });

    render(<SpacesPage />);
    expect(
      await screen.findByText(
        'Failed to load your spaces. Try again in a moment.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(
      await screen.findByText(
        /You have not created any spaces yet\. Create one from the simulator modal/i,
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('blocks risky actions when ruleset confirmation is denied or vessels are active', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'admin-1', role: 'admin' } },
    });
    const fetchMock = globalThis.fetch as unknown as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url.startsWith('http://api.test/api/spaces/manage')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            spaces: [
              {
                id: 'space-guarded',
                name: 'Guarded',
                visibility: 'public',
                inviteToken: 'invite-guarded',
                createdBy: 'admin-1',
                passwordProtected: false,
                totalVessels: 0,
                activeVessels: 1,
                rulesetType: 'CASUAL',
                rules: null,
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<SpacesPage />);
    await screen.findByDisplayValue('Guarded');

    fireEvent.change(screen.getByLabelText('Ruleset'), {
      target: { value: 'REALISM' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          url === 'http://api.test/api/spaces/space-guarded' &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patchCalls).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      screen.getByText('Cannot delete a space while vessels exist.'),
    ).toBeInTheDocument();
  });
});
