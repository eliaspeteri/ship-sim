import React from 'react';
import { render, screen } from '@testing-library/react';
import Barometer from '../../../src/components/Barometer';

describe('Barometer', () => {
  it('renders weather labels and scale path', () => {
    const { container } = render(
      <Barometer
        pressureHpa={1000}
        referencePressureHpa={1010}
        temperatureCelsius={20}
        size={220}
      />,
    );

    expect(container.querySelector('#weather-path')).toBeTruthy();
    expect(screen.getByText('STORMY')).toBeInTheDocument();
    expect(screen.getByText('FAIR')).toBeInTheDocument();
    expect(screen.getByText('VERY DRY')).toBeInTheDocument();
  });
});
