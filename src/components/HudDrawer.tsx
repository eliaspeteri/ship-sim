import React, { useMemo, useState } from 'react';
import EnvironmentControls from './EnvironmentControls';
import useStore from '../store';
import { getSimulationLoop } from '../simulation';
import socketManager from '../networking/socket';
import { RadarDisplay, RadarSettings } from './radar';
import { TelegraphLever } from './TelegraphLever';
import { HelmControl } from './HelmControl';
import RudderAngleIndicator from './RudderAngleIndicator';
import { RUDDER_STALL_ANGLE_DEG, clampRudderAngle } from '../constants/vessel';
import { ChatPanel } from './ChatPanel';
import EventLog from './EventLog';
import { MarineRadio } from './radio/index';

type HudTab =
  | 'navigation'
  | 'weather'
  | 'systems'
  | 'spaces'
  | 'chat'
  | 'events'
  | 'radio'
  | 'radar';

const tabs: { id: HudTab; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'weather', label: 'Weather' },
  { id: 'systems', label: 'Systems' },
  { id: 'spaces', label: 'Spaces' },
  { id: 'chat', label: 'Chat' },
  { id: 'events', label: 'Events' },
  { id: 'radio', label: 'Radio' },
  { id: 'radar', label: 'Radar' },
];

const formatDegrees = (rad?: number) => {
  if (rad === undefined) return '—';
  const deg = (rad * 180) / Math.PI;
  const normalized = ((deg % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
};

const formatKnots = (val?: number) =>
  `${((val || 0) * 1.94384).toFixed(1)} kts`;

interface HudDrawerProps {
  onOpenSpaces?: () => void;
}

export function HudDrawer({ onOpenSpaces }: HudDrawerProps) {
  const [tab, setTab] = useState<HudTab | null>('navigation');
  const [pressedTab, setPressedTab] = useState<HudTab | null>(null);
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);
  const helm = vessel.helm;
  const controls = useStore(state => state.vessel.controls);
  const [radarSettings, setRadarSettings] = useState<RadarSettings>({
    band: 'X',
    range: 6,
    gain: 70,
    seaClutter: 50,
    rainClutter: 50,
    heading: 0,
    orientation: 'head-up',
    trails: true,
    trailDuration: 30,
    nightMode: false,
  });
  const [throttleLocal, setThrottleLocal] = useState(controls?.throttle || 0);
  const [rudderAngleLocal, setRudderAngleLocal] = useState(
    controls?.rudderAngle || 0,
  );
  const [ballastLocal, setBallastLocal] = useState(controls?.ballast ?? 0.5);

  // sync controls from store
  React.useEffect(() => {
    if (!controls) return;
    setThrottleLocal(controls.throttle ?? 0);
    setRudderAngleLocal(controls.rudderAngle ?? 0);
    setBallastLocal(controls.ballast ?? 0.5);
  }, [controls?.throttle, controls?.rudderAngle, controls]);

  // apply controls to sim + server
  React.useEffect(() => {
    if (mode === 'spectator') return;
    if (!controls) return;
    const simulationLoop = getSimulationLoop();
    try {
      const clampedRudder = clampRudderAngle(rudderAngleLocal);
      simulationLoop.applyControls({
        throttle: throttleLocal,
        rudderAngle: clampedRudder,
        ballast: ballastLocal,
      });
      socketManager.sendControlUpdate(
        throttleLocal,
        clampedRudder,
        ballastLocal,
      );
    } catch (error) {
      console.error('Error applying controls from HUD:', error);
    }
  }, [throttleLocal, rudderAngleLocal, ballastLocal, controls, mode]);

  const navStats = useMemo(
    () => [
      {
        label: 'Heading',
        value: formatDegrees(vessel.orientation.heading),
      },
      {
        label: 'Speed',
        value: formatKnots(vessel.velocity.surge),
      },
      {
        label: 'Rudder',
        value: `${((vessel.controls.rudderAngle || 0) * 180) / Math.PI > 0 ? '+' : ''}${(
          ((vessel.controls.rudderAngle || 0) * 180) /
          Math.PI
        ).toFixed(1)}°`,
      },
      {
        label: 'Throttle',
        value: `${((vessel.controls.throttle || 0) * 100).toFixed(0)}%`,
      },
      {
        label: 'Ballast',
        value: `${((vessel.controls.ballast || 0.5) * 100).toFixed(0)}%`,
      },
      {
        label: 'Lat',
        value:
          vessel.position.lat !== undefined
            ? vessel.position.lat.toFixed(6)
            : '—',
      },
      {
        label: 'Lon',
        value:
          vessel.position.lon !== undefined
            ? vessel.position.lon.toFixed(6)
            : '—',
      },
      {
        label: 'Pos X',
        value: `${vessel.position.x?.toFixed(1) ?? '0.0'} m`,
      },
      {
        label: 'Pos Y',
        value: `${vessel.position.y?.toFixed(1) ?? '0.0'} m`,
      },
      {
        label: 'Yaw rate',
        value: `${Math.round(
          (((vessel.angularVelocity?.yaw || 0) * 180) / Math.PI) % 360,
        )}°/s`,
      },
      {
        label: 'Sea state',
        value: `${Math.round(environment.seaState ?? 0)}`,
        detail: `${(environment.waveHeight ?? 0).toFixed(1)} m waves`,
      },
      {
        label: 'Time',
        value: formatTime(environment.timeOfDay ?? 12),
        detail: 'UTC',
      },
      {
        label: 'Wind',
        value: `${formatKnots(environment.wind.speed)} @ ${formatDegrees(environment.wind.direction)}`,
      },
    ],
    [
      environment.seaState,
      environment.timeOfDay,
      environment.waveHeight,
      environment.wind.direction,
      environment.wind.speed,
      vessel.controls.ballast,
      vessel.controls.rudderAngle,
      vessel.controls.throttle,
      vessel.orientation.heading,
      vessel.velocity.surge,
    ],
  );

  const handleTabClick = (id: HudTab) => {
    if (id === 'spaces' && onOpenSpaces) {
      onOpenSpaces();
      setTab(null);
      return;
    }
    setTab(prev => (prev === id ? null : id));
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 text-white">
      {tab ? (
        <div className="mx-auto mb-3 w-[90vw] max-w-5xl rounded-2xl border border-teal-900/50 bg-[#0c1a2a]/90 p-4 shadow-2xl backdrop-blur pointer-events-auto max-h-[72vh] overflow-y-auto">
          {tab === 'navigation' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {navStats.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-gray-800 bg-gray-800/60 px-3 py-2"
                  >
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">
                      {stat.label}
                    </div>
                    <div className="text-base font-semibold">{stat.value}</div>
                    {stat.detail ? (
                      <div className="text-xs text-gray-400">{stat.detail}</div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-start gap-4 rounded-xl border border-gray-800 bg-gray-800/60 p-3">
                <TelegraphLever
                  label="Throttle"
                  value={throttleLocal}
                  min={-1}
                  max={1}
                  onChange={setThrottleLocal}
                  scale={[
                    { label: 'F.Astern', value: -1, major: true },
                    { label: 'H.Astern', value: -0.5 },
                    { label: 'S.Astern', value: -0.25 },
                    { label: 'Stop', value: 0, major: true },
                    { label: 'S.Ahead', value: 0.25 },
                    { label: 'H.Ahead', value: 0.5 },
                    { label: 'F.Ahead', value: 1, major: true },
                  ]}
                />
                <HelmControl
                  value={(rudderAngleLocal * 180) / Math.PI}
                  minAngle={-RUDDER_STALL_ANGLE_DEG}
                  maxAngle={RUDDER_STALL_ANGLE_DEG}
                  onChange={deg =>
                    setRudderAngleLocal(clampRudderAngle((deg * Math.PI) / 180))
                  }
                />
                <RudderAngleIndicator
                  angle={(rudderAngleLocal * 180) / Math.PI}
                  maxAngle={RUDDER_STALL_ANGLE_DEG}
                  size={160}
                />
                <div className="flex flex-col space-y-1">
                  <div className="text-gray-400 text-xs">Ballast</div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={ballastLocal}
                    onChange={e => setBallastLocal(parseFloat(e.target.value))}
                    className="w-40 accent-blue-500"
                  />
                  <div className="text-xs text-gray-300">
                    {(ballastLocal * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'weather' ? <EnvironmentControls /> : null}
          {tab === 'systems' ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-300">
              Systems, fuel, ballast, and electrics panels will live here. For
              now, use the dashboard controls while this drawer is built out.
            </div>
          ) : null}
          {tab === 'chat' ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-2 text-sm">
              <ChatPanel
                spaceId={useStore.getState().spaceId}
                vesselChannel={
                  useStore.getState().currentVesselId
                    ? `vessel:${
                        useStore.getState().currentVesselId?.split('_')[0] || ''
                      }`
                    : null
                }
              />
            </div>
          ) : null}
          {tab === 'events' ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-300">
              <EventLog />
            </div>
          ) : null}
          {tab === 'radio' ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-300">
              <div className="scale-90 origin-top-left">
                <MarineRadio />
              </div>
            </div>
          ) : null}
          {tab === 'radar' ? (
            <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-800/60 p-3 text-sm text-gray-300">
              <div className="flex flex-col items-center gap-3">
                <RadarDisplay
                  size={360}
                  initialSettings={radarSettings}
                  onSettingsChange={setRadarSettings}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="pointer-events-auto bg-gray-950/90 backdrop-blur border-t border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          HUD • {mode === 'spectator' ? 'Spectator' : 'Player'} mode
          {helm?.userId ? ` • Helm: ${helm.username || helm.userId}` : ''}
        </div>
        <div className="flex gap-3">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={() => setPressedTab(t.id)}
              onMouseUp={() => setPressedTab(null)}
              onClick={() => handleTabClick(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id || pressedTab === t.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}
