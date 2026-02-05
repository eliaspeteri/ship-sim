import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useStore from '../../../src/store';
import { WeatherVisualizer } from '../../../src/components/WeatherVisualizer';
import { loadWasm } from '../../../src/lib/wasmLoader';

jest.mock('../../../src/lib/wasmLoader', () => ({
  loadWasm: jest.fn(),
}));

const loadWasmMock = loadWasm as jest.MockedFunction<typeof loadWasm>;

describe('WeatherVisualizer', () => {
  const initialState = useStore.getState();

  afterEach(() => {
    useStore.setState(initialState, true);
    loadWasmMock.mockReset();
  });

  it('renders weather data and precipitation using wasm sea state', async () => {
    const calculateSeaState = jest.fn().mockReturnValue(7);
    loadWasmMock.mockResolvedValue({ calculateSeaState } as any);

    useStore.setState({
      environment: {
        wind: { speed: 30, direction: Math.PI, gusting: true, gustFactor: 1.2 },
        current: {
          speed: 2,
          direction: Math.PI / 2,
          variability: 0,
        },
        seaState: 6,
        timeOfDay: 0,
      },
    });

    render(<WeatherVisualizer />);

    await waitFor(() => {
      expect(loadWasmMock).toHaveBeenCalled();
      expect(calculateSeaState).toHaveBeenCalledWith(30);
      const label = screen.getByText('Beaufort Scale:');
      expect(label.parentElement).toHaveTextContent(
        'Beaufort Scale: 7 (Near Gale)',
      );
    });

    const [windSpeedLabel] = screen.getAllByText('Speed:');
    expect(windSpeedLabel.parentElement).toHaveTextContent('Speed: 108.0 km/h');
    const [windDirectionLabel] = screen.getAllByText('Direction:');
    expect(windDirectionLabel.parentElement).toHaveTextContent(
      'Direction: 180° S',
    );
    const gustLabel = screen.getByText('Gusting:');
    expect(gustLabel.parentElement).toHaveTextContent('Gusting: Yes');
    const typeLabel = screen.getByText('Type:');
    expect(typeLabel.parentElement).toHaveTextContent('Type: Rain');
    const intensityLabel = screen.getByText('Intensity:');
    expect(intensityLabel.parentElement).toHaveTextContent('Intensity: Heavy');
  });
});
