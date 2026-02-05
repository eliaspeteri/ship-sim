import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../../src/components/Dashboard';
import useStore from '../../../src/store';

const initialState = useStore.getState();

afterEach(() => {
  useStore.setState(initialState, true);
});

describe('Dashboard', () => {
  it('renders crew, helm, and alarm info', () => {
    useStore.setState({
      crewIds: ['u1', 'u2'],
      crewNames: { u1: 'Ace', u2: 'Sam' },
      sessionUserId: 'u2',
      vessel: {
        ...initialState.vessel,
        helm: { userId: 'u1', username: 'Ace' },
        position: { ...initialState.vessel.position, lat: 12.34, lon: 56.78 },
        orientation: { heading: Math.PI / 2, roll: 0, pitch: 0 },
        velocity: { surge: 1, sway: 0, heave: 0 },
        angularVelocity: { yaw: 0.1, roll: 0, pitch: 0 },
        engineState: { ...initialState.vessel.engineState, rpm: 900 },
        alarms: { ...initialState.vessel.alarms, engineOverheat: true },
      },
      environment: {
        ...initialState.environment,
        wind: {
          speed: 4,
          direction: Math.PI / 2,
          gusting: false,
          gustFactor: 1.5,
        },
        current: { speed: 1, direction: 0, variability: 0 },
      },
    });

    render(<Dashboard />);

    const crewLabels = screen.getAllByText('Crew');
    expect(crewLabels.length).toBeGreaterThan(0);
    expect(screen.getByText(/Helm:\s*Ace/)).toBeInTheDocument();
    expect(screen.getByText(/Ace\s*\(helm\)/)).toBeInTheDocument();
    expect(screen.getByText(/Sam/)).toBeInTheDocument();
    expect(screen.getByText('ENGINE TEMP')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Engine RPM')).toBeInTheDocument();
  });
});
