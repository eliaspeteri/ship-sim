import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  HudCrewPanel,
  HudEcdisPanel,
  HudNavigationPanel,
  HudSounderPanel,
  HudVesselsPanel,
} from '../../../../src/components/hud/HudPanels';

jest.mock('../../../../src/components/EnvironmentControls', () => {
  function EnvironmentControlsMock() {
    return <div>Environment Controls Mock</div>;
  }
  return EnvironmentControlsMock;
});

jest.mock('../../../../src/components/TelegraphLever', () => ({
  TelegraphLever: () => <div>Telegraph Lever Mock</div>,
}));

jest.mock('../../../../src/components/HelmControl', () => ({
  HelmControl: () => <div>Helm Control Mock</div>,
}));

jest.mock('../../../../src/components/RudderAngleIndicator', () => {
  function RudderAngleIndicatorMock() {
    return <div>Rudder Indicator Mock</div>;
  }
  return RudderAngleIndicatorMock;
});

jest.mock('../../../../src/components/ChatPanel', () => ({
  ChatPanel: () => <div>Chat Panel Mock</div>,
}));

jest.mock('../../../../src/components/EventLog', () => {
  function EventLogMock() {
    return <div>Event Log Mock</div>;
  }
  return EventLogMock;
});

jest.mock('../../../../src/components/radio', () => ({
  MarineRadio: () => <div>Marine Radio Mock</div>,
}));

jest.mock('../../../../src/components/bridge/ConningDisplay', () => ({
  ConningDisplay: () => <div>Conning Display Mock</div>,
}));

jest.mock('../../../../src/components/alarms/AlarmIndicator', () => ({
  AlarmIndicator: () => <div>Alarm Indicator Mock</div>,
}));

jest.mock('../../../../src/components/DepthSounder', () => ({
  __esModule: true,
  default: ({ depth }: { depth: number }) => <div>Depth: {depth}</div>,
}));

jest.mock('../../../../src/components/navigation/ecdis/EcdisDisplay', () => ({
  EcdisDisplay: ({
    shipPosition,
    heading,
  }: {
    shipPosition: { lat: number; lon: number };
    heading?: number;
  }) => (
    <div>
      ECDIS Mock {shipPosition.lat},{shipPosition.lon},{heading ?? 'none'}
    </div>
  ),
}));

jest.mock('../../../../src/components/radar', () => ({
  RadarDisplay: () => <div>Radar Display Mock</div>,
}));

jest.mock('../../../../src/components/SystemMeter', () => ({
  SystemMeter: () => <div>System Meter Mock</div>,
}));

describe('HudPanels exports', () => {
  it('renders vessel sections and handles join actions', () => {
    const onJoinVessel = jest.fn();

    render(
      <HudVesselsPanel
        fleetLoading
        fleetError="Fleet degraded"
        fleetInSpace={
          [
            {
              id: 'v-active',
              lat: 60.123,
              lon: 24.987,
              status: 'active',
              spaceId: 'sim-a',
            },
            {
              id: 'v-stored',
              lat: 60.5,
              lon: 25.2,
              status: 'stored',
            },
          ] as any
        }
        fleetOtherSpace={
          [
            {
              id: 'v-other',
              status: 'active',
              spaceId: 'other-space',
            },
          ] as any
        }
        resolveNearestPort={() =>
          ({
            port: { name: 'Harbor One' },
            distance: 1234,
          }) as any
        }
        shortId={(id: string) => `short-${id}`}
        normalizedSpaceId="default-space"
        otherVessels={
          {
            ov1: {
              id: 'ov1',
              crewCount: 2,
              orientation: { heading: 34 },
              properties: { name: 'Scout' },
            },
          } as any
        }
        onJoinVessel={onJoinVessel}
      />,
    );

    expect(screen.getByText('Fleet control')).toBeInTheDocument();
    expect(screen.getByText('Loading fleet...')).toBeInTheDocument();
    expect(screen.getByText('Fleet degraded')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Nearest port Harbor One/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Stored' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    fireEvent.click(screen.getByRole('button', { name: 'Request join' }));

    expect(onJoinVessel).toHaveBeenNthCalledWith(1, 'v-active');
    expect(onJoinVessel).toHaveBeenNthCalledWith(2, 'ov1');
  });

  it('renders empty vessel states', () => {
    render(
      <HudVesselsPanel
        fleetLoading={false}
        fleetError={null}
        fleetInSpace={[] as any}
        fleetOtherSpace={[] as any}
        resolveNearestPort={() => ({ port: null, distance: null })}
        shortId={(id: string) => id}
        normalizedSpaceId="default-space"
        otherVessels={{}}
        onJoinVessel={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        /No vessels in this space\. Charter one from the economy page\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No nearby vessels.')).toBeInTheDocument();
  });

  it('renders crew panel and handles claim/release logic', () => {
    const onRequestStation = jest.fn();
    const stationByUser = new Map<string, string[]>([['u1', ['helm']]]);

    render(
      <HudCrewPanel
        crewRoster={[{ id: 'u1', name: 'Captain' }]}
        stationByUser={stationByUser}
        helmStation={{ userId: 'u1', username: 'Captain' }}
        engineStation={{ userId: 'u2', username: 'Engineer' }}
        radioStation={null}
        sessionUserId="u1"
        crewIds={['u1']}
        isAdmin={false}
        onRequestStation={onRequestStation}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    expect(onRequestStation).toHaveBeenCalledWith('helm', 'release');

    const claimButtons = screen.getAllByRole('button', { name: 'Claim' });
    const enabledClaimButton = claimButtons.find(button => !button.disabled);
    const disabledClaimButton = claimButtons.find(button => button.disabled);

    expect(disabledClaimButton).toBeDefined();
    expect(enabledClaimButton).toBeDefined();

    fireEvent.click(enabledClaimButton as HTMLElement);
    expect(onRequestStation).toHaveBeenCalledWith('radio', 'claim');
  });

  it('shows empty crew roster fallback', () => {
    render(
      <HudCrewPanel
        crewRoster={[]}
        stationByUser={new Map()}
        helmStation={null}
        engineStation={null}
        radioStation={null}
        sessionUserId={null}
        crewIds={[]}
        isAdmin={false}
        onRequestStation={jest.fn()}
      />,
    );

    expect(screen.getByText('Awaiting crew assignments.')).toBeInTheDocument();
  });

  it('renders navigation stats including optional details', () => {
    render(
      <HudNavigationPanel
        navStats={[
          { label: 'SOG', value: '12.0 kn', detail: 'stable' },
          { label: 'COG', value: '085°' },
        ]}
      />,
    );

    expect(screen.getByText('SOG')).toBeInTheDocument();
    expect(screen.getByText('12.0 kn')).toBeInTheDocument();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.getByText('COG')).toBeInTheDocument();
    expect(screen.getByText('085°')).toBeInTheDocument();
  });

  it('renders sounder fallback and active depth display', () => {
    const { rerender } = render(<HudSounderPanel depthValue={undefined} />);
    expect(
      screen.getByText('Depth data unavailable for this position.'),
    ).toBeInTheDocument();

    rerender(<HudSounderPanel depthValue={23.4} />);
    expect(screen.getByText('Depth: 23.4')).toBeInTheDocument();
  });

  it('passes ship position and heading to ECDIS panel', () => {
    render(
      <HudEcdisPanel shipPosition={{ lat: 60.1, lon: 24.9 }} heading={42} />,
    );

    expect(screen.getByText('ECDIS Mock 60.1,24.9,42')).toBeInTheDocument();
  });
});
