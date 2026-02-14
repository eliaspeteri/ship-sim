import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import AdminPage from '../../../src/pages/admin';
import { socketManager } from '../../../src/networking/socket';

const useSessionMock = jest.fn();
const replaceMock = jest.fn();
const getApiBaseMock = jest.fn(() => 'http://api.test');

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock('../../../src/networking/socket', () => ({
  __esModule: true,
  socketManager: {
    isConnected: jest.fn(() => true),
    subscribeConnectionStatus: jest.fn(
      (listener: (connected: boolean) => void) => {
        listener(true);
        return () => undefined;
      },
    ),
    connect: jest.fn(),
    waitForConnection: jest.fn(() => Promise.resolve()),
    setAuthToken: jest.fn(),
    sendAdminVesselMove: jest.fn(),
    sendAdminKick: jest.fn(),
  },
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: () => getApiBaseMock(),
}));

describe('pages/admin', () => {
  const mockSocket = socketManager as unknown as {
    isConnected: jest.Mock;
    subscribeConnectionStatus: jest.Mock;
    connect: jest.Mock;
    waitForConnection: jest.Mock;
    setAuthToken: jest.Mock;
    sendAdminVesselMove: jest.Mock;
    sendAdminKick: jest.Mock;
  };

  beforeEach(() => {
    useSessionMock.mockReset();
    replaceMock.mockReset();
    getApiBaseMock.mockReset();
    getApiBaseMock.mockReturnValue('http://api.test');
    Object.values(mockSocket).forEach(value => {
      if (typeof value === 'function') value.mockReset?.();
    });
    mockSocket.isConnected.mockReturnValue(true);
    mockSocket.subscribeConnectionStatus.mockImplementation(
      (listener: (connected: boolean) => void) => {
        listener(true);
        return () => undefined;
      },
    );
    mockSocket.waitForConnection.mockResolvedValue(undefined);
    (globalThis as any).fetch = jest.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/metrics') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { lastMs: 15, avgMs: 12, maxMs: 30, count: 1 },
            broadcast: { lastMs: 5, avgMs: 4, maxMs: 9, count: 1 },
            ai: { lastMs: 7, avgMs: 6, maxMs: 11, count: 1 },
            socketLatency: { lastMs: 40, avgMs: 38, maxMs: 44, count: 1 },
            sockets: { connected: 2 },
            spaces: {
              s1: {
                spaceId: 's1',
                name: 'Alpha',
                connected: 2,
                vessels: 3,
                aiVessels: 1,
                playerVessels: 2,
                lastBroadcastAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
            updatedAt: Date.now(),
          }),
        });
      }
      if (url.startsWith('http://api.test/api/logs?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            logs: [
              {
                id: 'l1',
                timestamp: Date.now(),
                level: 'info',
                source: 'api',
                message: 'hello',
              },
            ],
          }),
        });
      }
      if (url === 'http://api.test/api/logs' && method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.startsWith('http://api.test/api/admin/moderation?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bans: [], mutes: [] }),
        });
      }
      if (url === 'http://api.test/api/admin/bans' && method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url === 'http://api.test/api/admin/users/user-1/role') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });
  });

  it('renders loading and access denied states', () => {
    useSessionMock.mockReturnValue({ status: 'loading', data: null });
    const { unmount } = render(<AdminPage />);
    expect(screen.getByText('Loading admin console…')).toBeInTheDocument();

    unmount();
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'u1', role: 'player' } },
    });
    render(<AdminPage />);
    expect(
      screen.getByText('You do not have access to this view.'),
    ).toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith('/sim');
  });

  it('loads admin panels and handles moderation, role, kick and move actions', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'admin-1', role: 'admin', name: 'Admin' },
        socketToken: 'tkn',
      },
    });
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    render(<AdminPage />);

    await screen.findByText('Performance budgets');
    expect(screen.getByText('Socket status: connected')).toBeInTheDocument();
    expect(mockSocket.setAuthToken).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/logs',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Kick now' }));
    expect(
      screen.getByText('User id is required to kick.'),
    ).toBeInTheDocument();

    const kickRow = screen
      .getByRole('button', { name: 'Kick now' })
      .closest('div');
    if (!kickRow) {
      throw new Error('Kick controls row not found');
    }
    fireEvent.change(within(kickRow).getByPlaceholderText('user id'), {
      target: { value: 'player-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kick now' }));
    expect(mockSocket.sendAdminKick).toHaveBeenCalledWith(
      'player-2',
      undefined,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Update role' }));
    expect(screen.getByText('User id is required.')).toBeInTheDocument();
    const roleRow = screen
      .getByRole('button', { name: 'Update role' })
      .closest('div');
    if (!roleRow) {
      throw new Error('Role controls row not found');
    }
    fireEvent.change(within(roleRow).getByPlaceholderText('user id'), {
      target: { value: 'user-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update role' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/admin/users/user-1/role',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Teleport' }));
    expect(
      screen.getByText('Vessel id is required for repositioning.'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('vessel id'), {
      target: { value: 'v-1' },
    });
    fireEvent.change(screen.getByPlaceholderText('lat'), {
      target: { value: '60.1' },
    });
    fireEvent.change(screen.getByPlaceholderText('lon'), {
      target: { value: '24.9' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Teleport' }));
    expect(mockSocket.sendAdminVesselMove).toHaveBeenCalledWith('v-1', {
      lat: 60.1,
      lon: 24.9,
    });

    const banRow = screen.getByRole('button', { name: 'Ban' }).closest('div');
    if (!banRow) {
      throw new Error('Ban controls row not found');
    }
    fireEvent.change(within(banRow).getByPlaceholderText('user id'), {
      target: { value: 'user-ban' },
    });
    fireEvent.change(within(banRow).getByPlaceholderText('expires'), {
      target: { value: '2026-02-08T10:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ban' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/admin/bans',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('removes moderation entries and sends teleport when socket reconnects', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'admin-1', role: 'admin', name: 'Admin' },
        socketToken: 'tkn',
      },
    });
    mockSocket.isConnected.mockReturnValue(false);
    mockSocket.waitForConnection.mockResolvedValue(undefined);

    let banRemoved = false;
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/metrics') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api: { lastMs: 15, avgMs: 12, maxMs: 30, count: 1 },
            broadcast: { lastMs: 5, avgMs: 4, maxMs: 9, count: 1 },
            ai: { lastMs: 7, avgMs: 6, maxMs: 11, count: 1 },
            socketLatency: { lastMs: 40, avgMs: 38, maxMs: 44, count: 1 },
            sockets: { connected: 2 },
            spaces: {},
            updatedAt: Date.now(),
          }),
        });
      }
      if (url.startsWith('http://api.test/api/logs?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ logs: [] }),
        });
      }
      if (url.startsWith('http://api.test/api/admin/moderation?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            bans: banRemoved
              ? []
              : [{ id: 'ban-1', userId: 'u-ban', reason: 'spam' }],
            mutes: [{ id: 'mute-1', userId: 'u-mute', reason: 'noise' }],
          }),
        });
      }
      if (
        url === 'http://api.test/api/admin/bans/ban-1' &&
        method === 'DELETE'
      ) {
        banRemoved = true;
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (
        url === 'http://api.test/api/admin/mutes/mute-1' &&
        method === 'DELETE'
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: `Unhandled ${method} ${url}` }),
      });
    });

    render(<AdminPage />);
    await screen.findByText('Performance budgets');
    await screen.findByText(/u-ban/i);

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/admin/bans/ban-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText('vessel id'), {
      target: { value: 'v-reconnect' },
    });
    fireEvent.change(screen.getByPlaceholderText('lat'), {
      target: { value: '61.1' },
    });
    fireEvent.change(screen.getByPlaceholderText('lon'), {
      target: { value: '25.2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Teleport' }));

    await waitFor(() => {
      expect(mockSocket.connect).toHaveBeenCalledWith('http://api.test');
      expect(mockSocket.sendAdminVesselMove).toHaveBeenCalledWith(
        'v-reconnect',
        {
          lat: 61.1,
          lon: 25.2,
        },
      );
    });
  });
});
