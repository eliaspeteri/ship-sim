import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { TopNavigationBar } from '../../../../src/components/common/TopNavigationBar';

describe('TopNavigationBar', () => {
  it('renders brand and tabs', () => {
    render(
      <TopNavigationBar
        brand="NAV"
        tabs={['RADAR', 'ECDIS']}
        activeTab="RADAR"
      />,
    );

    expect(screen.getByText('NAV')).toBeInTheDocument();
    expect(screen.getByText('RADAR')).toBeInTheDocument();
    expect(screen.getByText('ECDIS')).toBeInTheDocument();
  });

  it('invokes onTabSelect when a tab is clicked', () => {
    const onTabSelect = jest.fn();
    render(
      <TopNavigationBar
        tabs={['RADAR', 'ECDIS']}
        activeTab="RADAR"
        onTabSelect={onTabSelect}
      />,
    );

    fireEvent.click(screen.getByText('ECDIS'));
    expect(onTabSelect).toHaveBeenCalledWith('ECDIS');
  });
});
