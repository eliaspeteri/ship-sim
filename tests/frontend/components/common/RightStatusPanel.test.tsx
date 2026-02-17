import { render, screen } from '@testing-library/react';
import React from 'react';

import { RightStatusPanel } from '../../../../src/components/common/RightStatusPanel';

const schema = [
  [
    {
      id: 'spd',
      label: 'SPD',
      mainValue: { text: 'data:speed' },
    },
    {
      id: 'hdg',
      label: 'HDG',
      mainValue: { text: 'data:heading' },
    },
  ],
];

describe('RightStatusPanel', () => {
  it('renders schema boxes and children', () => {
    render(
      <RightStatusPanel schema={schema} data={{ speed: 12, heading: 90 }}>
        <div>Route info</div>
      </RightStatusPanel>,
    );

    expect(screen.getByText('SPD')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('HDG')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('Route info')).toBeInTheDocument();
  });
});
