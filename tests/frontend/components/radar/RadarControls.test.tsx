import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RadarControls from '../../../../src/components/radar/RadarControls';
import {
  RadarSettings,
  EBL,
  VRM,
  GuardZone,
} from '../../../../src/components/radar/types';

const baseSettings: RadarSettings = {
  band: 'X',
  range: 6,
  gain: 70,
  seaClutter: 40,
  rainClutter: 30,
  heading: 0,
  orientation: 'head-up',
  trails: true,
  trailDuration: 30,
  nightMode: false,
};

const baseEbl: EBL = { active: false, angle: 12.5 };
const baseVrm: VRM = { active: false, distance: 2.4 };
const baseGuardZone: GuardZone = {
  active: false,
  startAngle: 320,
  endAngle: 40,
  innerRange: 0.5,
  outerRange: 3,
};

describe('RadarControls', () => {
  it('wires settings and tool interactions', () => {
    const onSettingChange = jest.fn();
    const onRangeChange = jest.fn();
    const onEblToggle = jest.fn();
    const onEblAngleChange = jest.fn();
    const onVrmToggle = jest.fn();
    const onVrmDistanceChange = jest.fn();
    const onToggleArpa = jest.fn();
    const onGuardZoneChange = jest.fn();

    render(
      <RadarControls
        settings={baseSettings}
        onSettingChange={onSettingChange}
        onRangeChange={onRangeChange}
        ebl={baseEbl}
        vrm={baseVrm}
        onEblToggle={onEblToggle}
        onEblAngleChange={onEblAngleChange}
        onVrmToggle={onVrmToggle}
        onVrmDistanceChange={onVrmDistanceChange}
        onToggleArpa={onToggleArpa}
        arpaEnabled={false}
        guardZone={baseGuardZone}
        onGuardZoneChange={onGuardZoneChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '−' }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onRangeChange).toHaveBeenCalledWith('decrease');
    expect(onRangeChange).toHaveBeenCalledWith('increase');

    fireEvent.click(screen.getByText('S'));
    expect(onSettingChange).toHaveBeenCalledWith('band', 'S');

    fireEvent.click(screen.getByText('N-UP'));
    expect(onSettingChange).toHaveBeenCalledWith('orientation', 'north-up');

    fireEvent.click(screen.getByLabelText('Night Mode'));
    expect(onSettingChange).toHaveBeenCalledWith('nightMode', true);

    const eblHeader = screen.getByText(/EBL/).closest('div');
    const eblSection = eblHeader?.parentElement as HTMLElement;
    const eblCheckbox = within(eblSection).getByRole('checkbox');
    fireEvent.click(eblCheckbox);
    expect(onEblToggle).toHaveBeenCalled();

    const eblSlider = within(eblSection).getByRole('slider');
    fireEvent.change(eblSlider, { target: { value: '40' } });
    expect(onEblAngleChange).toHaveBeenCalledWith(40);

    const vrmHeader = screen.getByText(/VRM/).closest('div');
    const vrmSection = vrmHeader?.parentElement as HTMLElement;
    const vrmCheckbox = within(vrmSection).getByRole('checkbox');
    fireEvent.click(vrmCheckbox);
    expect(onVrmToggle).toHaveBeenCalled();

    const vrmSlider = within(vrmSection).getByRole('slider');
    fireEvent.change(vrmSlider, { target: { value: '3.2' } });
    expect(onVrmDistanceChange).toHaveBeenCalledWith(3.2);

    const guardZone = screen.getByText('Guard Zone').closest('div');
    const guardCheckbox = within(guardZone as HTMLElement).getByRole(
      'checkbox',
    );
    fireEvent.click(guardCheckbox);
    expect(onGuardZoneChange).toHaveBeenCalledWith('active', true);

    const [startInput, endInput, innerInput, outerInput] = within(
      guardZone as HTMLElement,
    ).getAllByRole('spinbutton');

    fireEvent.change(startInput, { target: { value: '10' } });
    fireEvent.change(endInput, { target: { value: '180' } });
    fireEvent.change(innerInput, { target: { value: '1.2' } });
    fireEvent.change(outerInput, { target: { value: '4.4' } });

    expect(onGuardZoneChange).toHaveBeenCalledWith('startAngle', 10);
    expect(onGuardZoneChange).toHaveBeenCalledWith('endAngle', 180);
    expect(onGuardZoneChange).toHaveBeenCalledWith('innerRange', 1.2);
    expect(onGuardZoneChange).toHaveBeenCalledWith('outerRange', 4.4);

    fireEvent.click(screen.getByRole('button', { name: 'Enable ARPA' }));
    expect(onToggleArpa).toHaveBeenCalled();
  });
});
