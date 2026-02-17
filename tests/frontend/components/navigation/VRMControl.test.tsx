import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import {
  VRMControl,
  VRMState,
} from '../../../../src/components/navigation/VRMControl';

describe('VRMControl', () => {
  const baseState: VRMState = {
    id: 'VRM1',
    isActive: false,
    radius: 2.5,
    origin: 'ship',
  };

  it('toggles settings and active state', () => {
    const setVrmState = jest.fn();
    render(<VRMControl vrmState={baseState} setVrmState={setVrmState} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('checkbox'));

    expect(setVrmState).toHaveBeenCalledWith({
      ...baseState,
      isActive: true,
    });
  });

  it('updates radius when input is valid', () => {
    const setVrmState = jest.fn();
    const activeState = { ...baseState, isActive: true };
    render(<VRMControl vrmState={activeState} setVrmState={setVrmState} />);

    fireEvent.click(screen.getByRole('button'));

    const radiusInput = screen.getByRole('spinbutton');
    fireEvent.change(radiusInput, { target: { value: '4.25' } });

    expect(setVrmState).toHaveBeenCalledWith({
      ...activeState,
      radius: 4.25,
    });
  });

  it('ignores negative radius values', () => {
    const setVrmState = jest.fn();
    const activeState = { ...baseState, isActive: true };
    render(<VRMControl vrmState={activeState} setVrmState={setVrmState} />);

    fireEvent.click(screen.getByRole('button'));

    const radiusInput = screen.getByRole('spinbutton');
    fireEvent.change(radiusInput, { target: { value: '-1' } });

    expect(setVrmState).not.toHaveBeenCalled();
  });
});
