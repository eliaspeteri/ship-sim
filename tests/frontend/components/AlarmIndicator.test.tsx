import { act, render } from '@testing-library/react';
import React from 'react';

import { AlarmIndicator } from '../../../src/components/alarms/AlarmIndicator';

describe('AlarmIndicator', () => {
  it('renders inactive indicator with neutral color', () => {
    const { container } = render(
      <AlarmIndicator active={false} label="Test alarm" />,
    );

    const indicator = container.querySelector('div[style]');
    expect(indicator).toBeTruthy();
    expect(indicator).toHaveStyle({ backgroundColor: '#4B5563' });
  });

  it('toggles flash state for critical alarms', () => {
    jest.useFakeTimers();

    const { container } = render(
      <AlarmIndicator active label="Critical" severity="critical" size={10} />,
    );

    const indicator = container.querySelector('div[style]');
    expect(indicator).toHaveStyle({ backgroundColor: '#FF0000' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(indicator).toHaveStyle({ backgroundColor: '#374151' });

    jest.useRealTimers();
  });
});
