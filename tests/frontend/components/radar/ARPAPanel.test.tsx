import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

import {
  ARPATarget,
  ARPATargetStatus,
  ARPASettings,
  DEFAULT_ARPA_SETTINGS,
} from '../../../../src/components/radar/arpa';
import ARPAPanel from '../../../../src/components/radar/ARPAPanel';

const makeTarget = (overrides: Partial<ARPATarget> = {}): ARPATarget => {
  return {
    id: 't1',
    distance: 2.5,
    bearing: 45,
    size: 0.7,
    speed: 10,
    course: 90,
    type: 'ship',
    isTracked: true,
    trackId: 'ARPA-t1',
    acquiredTime: new Date('2023-12-31T23:00:00Z'),
    lastUpdatedTime: new Date('2023-12-31T23:59:00Z'),
    historicalPositions: [],
    calculatedCourse: 90,
    calculatedSpeed: 10,
    cpa: 0.2,
    tcpa: 5,
    bcr: 0.1,
    bcpa: 90,
    ...overrides,
  };
};

const makeSettings = (overrides: Partial<ARPASettings> = {}): ARPASettings => ({
  ...DEFAULT_ARPA_SETTINGS,
  ...overrides,
});

describe('ARPAPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders empty state and disables cancel', () => {
    const onAcquireTarget = jest.fn();

    render(
      <ARPAPanel
        arpaTargets={[]}
        selectedTargetId={null}
        onSelectTarget={jest.fn()}
        arpaSettings={makeSettings()}
        onSettingChange={jest.fn()}
        onAcquireTarget={onAcquireTarget}
        onCancelTarget={jest.fn()}
      />,
    );

    expect(screen.getByText('No targets tracked')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Acquire' }));
    expect(onAcquireTarget).toHaveBeenCalled();
  });

  it('shows target details and wires settings/actions', () => {
    const onSettingChange = jest.fn();
    const onSelectTarget = jest.fn();
    const onCancelTarget = jest.fn();

    const target = makeTarget();

    render(
      <ARPAPanel
        arpaTargets={[target]}
        selectedTargetId={target.id}
        onSelectTarget={onSelectTarget}
        arpaSettings={makeSettings()}
        onSettingChange={onSettingChange}
        onAcquireTarget={jest.fn()}
        onCancelTarget={onCancelTarget}
      />,
    );

    expect(screen.getByText('TARGET DETAILS')).toBeInTheDocument();
    expect(screen.getByText(ARPATargetStatus.DANGEROUS)).toBeInTheDocument();

    const row = screen.getByRole('row', { name: /t1/ });
    fireEvent.click(within(row).getByText('t1'));
    expect(onSelectTarget).toHaveBeenCalledWith('t1');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelTarget).toHaveBeenCalledWith('t1');

    const toggle = screen.getAllByRole('checkbox')[0];
    fireEvent.click(toggle);
    expect(onSettingChange).toHaveBeenCalledWith(
      'autoAcquisitionEnabled',
      false,
    );

    fireEvent.click(screen.getByRole('button', { name: 'True' }));
    expect(onSettingChange).toHaveBeenCalledWith('relativeVectors', false);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '12' } });
    expect(onSettingChange).toHaveBeenCalledWith('vectorTimeMinutes', 12);
  });
});
