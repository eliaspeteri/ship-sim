import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { JoinChoiceModal } from '../../../../src/features/sim/JoinChoiceModal';

const scenarios = [
  {
    id: 'scenario-open',
    name: 'Open Scenario',
    description: 'Ready to start',
    rankRequired: 1,
    spawn: { lat: 60, lon: 24, z: 0 },
    rules: { colregs: true, collisionPenalty: 100, nearMissPenalty: 20 },
  },
  {
    id: 'scenario-locked',
    name: 'Locked Scenario',
    description: 'Needs rank',
    rankRequired: 3,
    spawn: { lat: 61, lon: 25, z: 0 },
    rules: { colregs: true, collisionPenalty: 200, nearMissPenalty: 30 },
  },
];

const buildProps = (
  overrides?: Partial<React.ComponentProps<typeof JoinChoiceModal>>,
) => ({
  isOpen: true,
  ports: [
    { name: 'Port A', position: { lat: 60, lon: 24 } },
    { name: 'Port B', position: { lat: 61, lon: 25 } },
  ],
  selectedPort: 'Port A',
  onSelectPort: jest.fn(),
  joinableVessels: [{ id: 'v1', crewCount: 1, label: 'Vessel One' }],
  maxCrew: 4,
  canEnterPlayerMode: true,
  onJoinVessel: jest.fn(),
  onQuickJoin: jest.fn(),
  onCreateVessel: jest.fn(),
  onSpectate: jest.fn(),
  scenarios,
  scenarioLoadingId: null,
  scenarioError: null,
  accountRank: 1,
  onStartScenario: jest.fn(),
  ...overrides,
});

describe('JoinChoiceModal', () => {
  it('does not render when closed', () => {
    render(<JoinChoiceModal {...buildProps({ isOpen: false })} />);

    expect(screen.queryByText('Choose how to join')).not.toBeInTheDocument();
  });

  it('handles player actions and scenario controls', () => {
    const props = buildProps();

    render(<JoinChoiceModal {...props} />);

    fireEvent.change(screen.getByDisplayValue('Port A'), {
      target: { value: 'Port B' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Vessel One/i }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Quick join smallest crew' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Create my own vessel' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Spectate the world' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start scenario' }));

    expect(props.onSelectPort).toHaveBeenCalledWith('Port B');
    expect(props.onJoinVessel).toHaveBeenCalledWith('v1');
    expect(props.onQuickJoin).toHaveBeenCalled();
    expect(props.onCreateVessel).toHaveBeenCalledWith('Port A');
    expect(props.onSpectate).toHaveBeenCalled();
    expect(props.onStartScenario).toHaveBeenCalledWith(scenarios[0]);

    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
  });

  it('renders loading scenario action and spectator-only mode', () => {
    const props = buildProps({
      scenarioLoadingId: 'scenario-open',
      canEnterPlayerMode: false,
      joinableVessels: [],
    });

    render(<JoinChoiceModal {...props} />);

    expect(
      screen.getByText('Your role is spectator-only in this space.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Create my own vessel' }),
    ).not.toBeInTheDocument();
  });
});
