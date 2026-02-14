import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import RadarDisplay from '../../../../src/components/radar/RadarDisplay';
import { RadarTarget } from '../../../../src/components/radar/types';

jest.mock('../../../../src/components/radar/utils', () => {
  const actual = jest.requireActual('../../../../src/components/radar/utils');
  return {
    ...actual,
    generateNoisePattern: jest.fn(() => ({})),
  };
});

describe('RadarDisplay', () => {
  beforeEach(() => {
    let rafCalls = 0;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      if (rafCalls === 0) {
        rafCalls += 1;
        callback(0);
      }
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => {
        const gradient = {
          addColorStop: jest.fn(),
        } as unknown as CanvasGradient;
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          globalAlpha: 1,
          beginPath: jest.fn(),
          arc: jest.fn(),
          fill: jest.fn(),
          stroke: jest.fn(),
          fillRect: jest.fn(),
          putImageData: jest.fn(),
          save: jest.fn(),
          restore: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          setLineDash: jest.fn(),
          createRadialGradient: jest.fn(() => gradient),
          translate: jest.fn(),
          rotate: jest.fn(),
          rect: jest.fn(),
          closePath: jest.fn(),
          clip: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('toggles the ARPA panel on demand', () => {
    render(<RadarDisplay size={200} />);

    expect(
      screen.queryByRole('heading', { name: 'ARPA' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enable ARPA' }));

    expect(screen.getByRole('heading', { name: 'ARPA' })).toBeInTheDocument();
  });

  it('acquires targets and notifies on settings changes', async () => {
    const onSettingsChange = jest.fn();

    const target: RadarTarget = {
      id: 't1',
      distance: 2,
      bearing: 90,
      size: 0.6,
      speed: 12,
      course: 80,
      type: 'ship',
    };

    render(
      <RadarDisplay
        size={200}
        arpaEnabled
        initialTargets={[target]}
        onSettingsChange={onSettingsChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Night Mode'));
    expect(onSettingsChange).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Acquire' }));

    await waitFor(() => {
      expect(screen.getByText(/TRACKED TARGETS \(1\)/)).toBeInTheDocument();
    });
  });

  it('advances range and toggles measurement tools', () => {
    render(<RadarDisplay size={200} />);

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    expect(screen.getByText(/Range 12 NM/)).toBeInTheDocument();

    const eblRow = screen.getByText(/EBL/).closest('div');
    const vrmRow = screen.getByText(/VRM/).closest('div');
    expect(eblRow).toBeTruthy();
    expect(vrmRow).toBeTruthy();

    const eblToggle = within(eblRow as HTMLElement).getByRole('checkbox');
    const vrmToggle = within(vrmRow as HTMLElement).getByRole('checkbox');

    fireEvent.click(eblToggle);
    fireEvent.click(vrmToggle);

    expect(eblToggle).toBeChecked();
    expect(vrmToggle).toBeChecked();
  });

  it('clamps VRM distance and forwards guard zone updates', () => {
    const onVrmChange = jest.fn();
    const onGuardZoneChange = jest.fn();

    const { rerender } = render(
      <RadarDisplay
        size={200}
        vrm={{ active: false, distance: 0 }}
        onVrmChange={onVrmChange}
        guardZone={{
          active: false,
          startAngle: 320,
          endAngle: 40,
          innerRange: 0.5,
          outerRange: 3,
        }}
        onGuardZoneChange={onGuardZoneChange}
      />,
    );

    const vrmRow = screen.getByText(/VRM/).closest('div');
    expect(vrmRow).toBeTruthy();
    const vrmToggle = within(vrmRow as HTMLElement).getByRole('checkbox');
    fireEvent.click(vrmToggle);

    expect(onVrmChange).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, distance: 1.5 }),
    );

    rerender(
      <RadarDisplay
        size={200}
        vrm={{ active: true, distance: 1.5 }}
        onVrmChange={onVrmChange}
        guardZone={{
          active: false,
          startAngle: 320,
          endAngle: 40,
          innerRange: 0.5,
          outerRange: 3,
        }}
        onGuardZoneChange={onGuardZoneChange}
      />,
    );

    const vrmLabel = screen.getByText(/VRM/);
    const vrmContainer = vrmLabel.closest('div')?.parentElement;
    const vrmSlider = vrmContainer?.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
    expect(vrmSlider).toBeTruthy();
    fireEvent.change(vrmSlider as HTMLInputElement, {
      target: { value: '20' },
    });

    expect(onVrmChange).toHaveBeenCalledWith(
      expect.objectContaining({ distance: 6 }),
    );

    const guardZonePanel = screen.getByText('Guard Zone').parentElement;
    expect(guardZonePanel).toBeTruthy();
    const guardZoneScope = within(guardZonePanel as HTMLElement);
    fireEvent.click(guardZoneScope.getByRole('checkbox'));
    const guardInputs = guardZoneScope.getAllByRole('spinbutton');
    fireEvent.change(guardInputs[0], { target: { value: '300' } });

    expect(onGuardZoneChange).toHaveBeenCalledWith(
      expect.objectContaining({ active: true }),
    );
    expect(onGuardZoneChange).toHaveBeenCalledWith(
      expect.objectContaining({ startAngle: 300 }),
    );
  });
});
