import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { MarineRadio } from '../../../../src/components/radio/MarineRadio';

describe('MarineRadio', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('powers on and shows the default channel', async () => {
    render(<MarineRadio />);

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));

    await waitFor(() => {
      expect(screen.getByText(/CH 16/)).toBeInTheDocument();
    });
  });

  it('sends distress calls and updates display', async () => {
    const onDistressCall = jest.fn();
    const onChannelChange = jest.fn();

    render(
      <MarineRadio
        onDistressCall={onDistressCall}
        onChannelChange={onChannelChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));
    fireEvent.click(screen.getByRole('button', { name: 'DISTRESS' }));

    await waitFor(() => {
      expect(screen.getByText('DISTRESS ACTIVE')).toBeInTheDocument();
    });

    expect(onDistressCall).toHaveBeenCalled();
    expect(onChannelChange).toHaveBeenCalledWith(16, 156.8);
  });

  it('switches to channel 9 on double click', () => {
    const onChannelChange = jest.fn();

    render(<MarineRadio onChannelChange={onChannelChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));
    fireEvent.doubleClick(screen.getByRole('button', { name: '16/9' }));

    expect(onChannelChange).toHaveBeenCalledWith(9, 156.45);
  });

  it('toggles scan mode and advances channels', () => {
    render(<MarineRadio />);

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));
    fireEvent.click(screen.getByRole('button', { name: 'SCAN' }));

    expect(screen.getByText(/SCAN CH 16/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/SCAN CH 67/)).toBeInTheDocument();
  });

  it('accepts direct channel entry and updates channel', () => {
    const onChannelChange = jest.fn();

    render(<MarineRadio onChannelChange={onChannelChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(onChannelChange).toHaveBeenCalledWith(68, 156.425);
    expect(screen.getByText(/CH 68/)).toBeInTheDocument();
  });

  it('toggles position display with clear button', () => {
    render(
      <MarineRadio
        position={{ latitude: 10.5, longitude: 20.25 }}
        initialPower
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));

    expect(screen.getByText(/'N/)).toBeInTheDocument();
    expect(screen.getByText(/'E/)).toBeInTheDocument();
  });

  it('toggles transmit power between HI and LO', async () => {
    render(<MarineRadio />);

    fireEvent.click(screen.getByRole('button', { name: 'PWR' }));

    await waitFor(() => {
      expect(screen.getByText('HI')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'HI/LO' }));
    expect(screen.getByText('LO')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'HI/LO' }));
    expect(screen.getByText('HI')).toBeInTheDocument();
  });

  it('cycles menu options and toggles GPS position', async () => {
    render(
      <MarineRadio
        position={{ latitude: 12.25, longitude: 34.75 }}
        initialPower
      />,
    );

    const menuButton = screen.getByRole('button', { name: 'MENU' });

    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);
    fireEvent.click(menuButton);

    expect(screen.getByText('GPS/TIME')).toBeInTheDocument();

    fireEvent.doubleClick(menuButton);

    await waitFor(() => {
      expect(screen.getByText(/'N/)).toBeInTheDocument();
      expect(screen.getByText(/'E/)).toBeInTheDocument();
    });
  });
});
