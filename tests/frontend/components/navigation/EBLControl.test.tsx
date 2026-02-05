import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  EBLControl,
  EBLState,
} from '../../../../src/components/navigation/EBLControl';

describe('EBLControl', () => {
  const baseState: EBLState = {
    id: 'EBL1',
    isActive: false,
    bearing: 10.5,
    origin: 'ship',
  };

  it('toggles settings and active state', () => {
    const setEblState = jest.fn();
    render(<EBLControl eblState={baseState} setEblState={setEblState} />);

    fireEvent.click(screen.getByRole('button'));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(setEblState).toHaveBeenCalledWith({
      ...baseState,
      isActive: true,
    });
  });

  it('normalizes bearing input to 0-359 range', () => {
    const setEblState = jest.fn();
    const activeState = { ...baseState, isActive: true };
    render(<EBLControl eblState={activeState} setEblState={setEblState} />);

    fireEvent.click(screen.getByRole('button'));

    const bearingInput = screen.getByRole('spinbutton');
    fireEvent.change(bearingInput, { target: { value: '-10' } });

    expect(setEblState).toHaveBeenCalledWith({
      ...activeState,
      bearing: 350,
    });
  });
});
