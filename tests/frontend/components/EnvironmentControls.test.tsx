import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EnvironmentControls from '../../../src/components/EnvironmentControls';

let isConnected = true;
const mockSendWeatherControl = jest.fn();
let sessionRole = 'admin';
let mockState = {
  environment: {
    name: 'Auto Weather',
    wind: { speed: 5, direction: 120 },
    current: { speed: 1, direction: 240 },
    seaState: 3,
    visibility: 8,
    timeOfDay: 14,
    precipitation: 'rain',
    precipitationIntensity: 0.2,
    waterDepth: 12,
  },
  roles: [] as string[],
  spaceId: 'space-1',
  spaceInfo: { name: 'Test Space', role: 'host' },
  vessel: { position: { lon: 24.97 } },
};

jest.mock('../../../src/networking/socket', () => ({
  __esModule: true,
  socketManager: {
    isConnected: jest.fn(() => isConnected),
    sendWeatherControl: (...args: any[]) => mockSendWeatherControl(...args),
  },
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: jest.fn(() => ''),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { role: sessionRole } },
  }),
}));

jest.mock('../../../src/store', () => {
  const useStore = (selector: any) => selector(mockState);
  (useStore as any).getState = () => mockState;
  return {
    __esModule: true,
    default: useStore,
  };
});

describe('EnvironmentControls', () => {
  beforeEach(() => {
    isConnected = true;
    sessionRole = 'admin';
    mockState = {
      environment: {
        name: 'Auto Weather',
        wind: { speed: 5, direction: 120 },
        current: { speed: 1, direction: 240 },
        seaState: 3,
        visibility: 8,
        timeOfDay: 14,
        precipitation: 'rain',
        precipitationIntensity: 0.2,
        waterDepth: 12,
      },
      roles: [],
      spaceId: 'space-1',
      spaceInfo: { name: 'Test Space', role: 'host' },
      vessel: { position: { lon: 24.97 } },
    };
    mockSendWeatherControl.mockClear();
    (globalThis as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ events: [] }),
    }));
  });

  it('expands and sends weather presets', async () => {
    render(<EnvironmentControls />);

    fireEvent.click(screen.getByText('Expand'));

    await waitFor(() => {
      expect(screen.getByText('Weather presets')).toBeInTheDocument();
    });

    const presetPanel = screen.getByText('Weather presets').closest('div');
    if (!presetPanel) {
      throw new Error('Preset panel not found');
    }
    fireEvent.click(screen.getAllByRole('button', { name: 'Calm' })[0]);
    expect(mockSendWeatherControl).toHaveBeenCalledWith({
      pattern: 'calm',
      mode: 'manual',
    });
    expect(screen.getByText(/Sent calm preset to server/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Return to auto'));
    expect(mockSendWeatherControl).toHaveBeenCalledWith({ mode: 'auto' });
    expect(
      screen.getByText(/Server is now picking weather \+ real-time/i),
    ).toBeInTheDocument();
  });

  it('shows offline feedback and handles failed event loading', async () => {
    isConnected = false;
    (globalThis as any).fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));

    render(<EnvironmentControls />);
    fireEvent.click(screen.getByText('Expand'));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load scheduled events.'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Calm' })[0]);
    expect(
      screen.getByText('Socket offline; cannot send preset.'),
    ).toBeInTheDocument();
    expect(mockSendWeatherControl).not.toHaveBeenCalled();
  });

  it('handles schedule validation, create, and delete flows', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.includes('/api/environment/events?')) {
        return {
          ok: true,
          json: async () => ({
            events: [
              {
                id: 'evt-active',
                name: 'Active rain',
                runAt: '2026-01-01T10:00:00.000Z',
                executedAt: '2026-01-01T10:05:00.000Z',
                enabled: true,
              },
              {
                id: 'evt-ended',
                pattern: 'foggy',
                runAt: 'invalid-date',
                endAt: '2026-01-01T12:00:00.000Z',
                endedAt: '2026-01-01T12:05:00.000Z',
                enabled: true,
              },
            ],
          }),
        };
      }
      if (url.endsWith('/api/environment/events') && method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 'evt-new',
            name: 'New storm',
            pattern: 'stormy',
            runAt: '2026-01-01T09:00:00.000Z',
            enabled: true,
          }),
        };
      }
      if (url.endsWith('/api/environment/events/evt-active') && method === 'DELETE') {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: 'cannot remove active event' }),
        };
      }
      if (url.endsWith('/api/environment/events/evt-ended') && method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({}),
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    });
    (globalThis as any).fetch = fetchMock;

    render(<EnvironmentControls />);
    fireEvent.click(screen.getByText('Expand'));

    await waitFor(() => {
      expect(screen.getByText('Active rain')).toBeInTheDocument();
      expect(screen.getByText('Ended')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText(/Invalid time/)).toBeInTheDocument();
    });

    const scheduleInput = screen.getByDisplayValue(
      /T/,
    ) as HTMLInputElement;
    const endInputs = screen.getAllByPlaceholderText('End time (optional)');
    const endInput = endInputs[0] as HTMLInputElement;
    const scheduleName = screen.getByPlaceholderText(
      'Event label (optional)',
    ) as HTMLInputElement;

    fireEvent.change(scheduleInput, { target: { value: 'not-a-time' } });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    await waitFor(() => {
      expect(
        screen.getByText('Select a valid time for the event.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(scheduleInput, { target: { value: '2026-01-01T10:30' } });
    fireEvent.change(endInput, { target: { value: '2026-01-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    await waitFor(() => {
      expect(
        screen.getByText('End time must be after the start time.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(endInput, { target: { value: '' } });
    fireEvent.change(scheduleName, { target: { value: ' New storm ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    await waitFor(() => {
      expect(screen.getByText('New storm')).toBeInTheDocument();
    });
    expect(scheduleName.value).toBe('');

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    await waitFor(() => {
      expect(screen.getByText('cannot remove active event')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
    await waitFor(() => {
      expect(screen.queryByText('foggy')).not.toBeInTheDocument();
    });
  });
});
