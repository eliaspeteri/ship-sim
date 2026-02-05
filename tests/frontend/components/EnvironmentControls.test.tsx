import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EnvironmentControls from '../../../src/components/EnvironmentControls';

const mockSendWeatherControl = jest.fn();

jest.mock('../../../src/networking/socket', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn(() => true),
    sendWeatherControl: (...args: any[]) => mockSendWeatherControl(...args),
  },
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: jest.fn(() => ''),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { role: 'admin' } },
  }),
}));

const mockState = {
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
});
