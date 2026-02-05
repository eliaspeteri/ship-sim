import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConningDisplay } from '../../../../src/components/bridge/ConningDisplay';

const sampleData = {
  date: '2026-02-04',
  time: '18:45',
  latitude: 37.7749,
  longitude: -122.4194,
  heading: 123,
  windDirection: 210,
  windSpeed: 12.4,
  pitch: 1.2,
  roll: -0.8,
  dopplerLog: 7.1,
  rateOfTurn: 2.5,
  propellers: [
    { azimuth: 15, pitch: 10, rpm: 1200, side: 'port' as const },
    { azimuth: -10, pitch: 8, rpm: 1180, side: 'starboard' as const },
  ],
  dials: [10, 20, 30, 40],
};

describe('ConningDisplay', () => {
  it('renders core navigation data', () => {
    render(<ConningDisplay data={sampleData} />);

    expect(screen.getByText('Date and Time/UTC')).toBeInTheDocument();
    expect(screen.getByText(sampleData.date)).toBeInTheDocument();
    expect(screen.getByText(sampleData.time)).toBeInTheDocument();

    expect(screen.getByText('Latitude')).toBeInTheDocument();
    expect(
      screen.getByText(sampleData.latitude.toFixed(5)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(sampleData.longitude.toFixed(5)),
    ).toBeInTheDocument();

    expect(screen.getByText(/Heading/)).toBeInTheDocument();
    expect(
      screen.getByText(
        content =>
          content.includes('🧭') && content.includes(`${sampleData.heading}`),
      ),
    ).toBeInTheDocument();
  });

  it('shows propeller azimuth', () => {
    render(<ConningDisplay data={sampleData} />);
    expect(screen.getByText('Azim-th')).toBeInTheDocument();
    expect(
      screen.getByText(`${sampleData.propellers[0].azimuth}°`),
    ).toBeInTheDocument();
  });
});
