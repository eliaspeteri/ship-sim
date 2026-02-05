import React from 'react';
import { render, screen } from '@testing-library/react';
import { RouteInfoPanel } from '../../../../src/components/common/RouteInfoPanel';

describe('RouteInfoPanel', () => {
  it('renders route info entries', () => {
    render(
      <RouteInfoPanel
        routeInfo={[
          { label: 'ETA', value: '12:00' },
          { label: 'DIST', value: '5.2nm' },
        ]}
      />,
    );

    expect(screen.getByText('ROUTE INFO')).toBeInTheDocument();
    expect(screen.getByText('ETA')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('DIST')).toBeInTheDocument();
    expect(screen.getByText('5.2nm')).toBeInTheDocument();
  });
});
