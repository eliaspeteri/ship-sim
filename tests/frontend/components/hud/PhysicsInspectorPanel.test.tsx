import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { HudPhysicsInspectorPanel } from '../../../../src/components/hud/PhysicsInspectorPanel';

const mockBuildDisplacementParams = jest.fn();

jest.mock('../../../../src/lib/physicsParams', () => ({
  buildDisplacementParams: (...args: unknown[]) =>
    mockBuildDisplacementParams(...args),
}));

describe('HudPhysicsInspectorPanel', () => {
  beforeEach(() => {
    mockBuildDisplacementParams.mockReset();
    mockBuildDisplacementParams.mockReturnValue({
      mass: 1000,
      maxThrust: 5000,
      length: 12,
      beam: 4,
      draft: 2,
      blockCoefficient: 0.6,
      maxSpeed: 8,
    });
  });

  it('renders model info and applies numeric overrides', () => {
    const onApplyParams = jest.fn();

    render(
      <HudPhysicsInspectorPanel
        vessel={
          {
            physics: {
              model: 'displacement',
              schemaVersion: 2,
              params: {
                mass: 1200,
                maxThrust: 5500,
              },
            },
            properties: {},
            hydrodynamics: {},
          } as unknown as React.ComponentProps<
            typeof HudPhysicsInspectorPanel
          >['vessel']
        }
        onApplyParams={onApplyParams}
      />,
    );

    expect(screen.getByText('Physics Params')).toBeInTheDocument();
    expect(
      screen.getByText(/Model: displacement \| Schema: 2/i),
    ).toBeInTheDocument();

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1300' } });
    fireEvent.change(inputs[1], { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Apply overrides' }));

    expect(onApplyParams).toHaveBeenCalledWith(
      expect.objectContaining({
        mass: 1300,
        maxThrust: 5500,
      }),
    );
    expect(onApplyParams.mock.calls[0][0]).not.toHaveProperty('length');

    fireEvent.click(screen.getByRole('button', { name: 'Clear overrides' }));
    expect(onApplyParams).toHaveBeenLastCalledWith({});
  });
});
