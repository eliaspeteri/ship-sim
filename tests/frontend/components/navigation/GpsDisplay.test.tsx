import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GpsDisplay } from '../../../../src/components/navigation/GpsDisplay';

describe('GpsDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T03:04:05Z'));
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    (Math.random as jest.Mock).mockRestore();
  });

  it('renders initial GPS fields', () => {
    render(<GpsDisplay />);

    expect(screen.getByText('GPS/GNSS POSITION')).toBeInTheDocument();
    expect(screen.getByText("0° 0.0000' N")).toBeInTheDocument();
    expect(screen.getByText("0° 0.0000' E")).toBeInTheDocument();
    expect(screen.getByText('03:04:05')).toBeInTheDocument();
    expect(screen.getByText('14.20 kn')).toBeInTheDocument();
    expect(screen.getByText('87.5°')).toBeInTheDocument();
    expect(screen.getByText('3D FIX')).toBeInTheDocument();

    const satellitesRow = screen.getByText('Satellites:').parentElement;
    expect(satellitesRow).toHaveTextContent('9');
  });

  it('updates values on interval tick', () => {
    render(<GpsDisplay />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const satellitesRow = screen.getByText('Satellites:').parentElement;
    expect(satellitesRow).toHaveTextContent('10');
    expect(screen.getByText('14.25 kn')).toBeInTheDocument();
  });
});
