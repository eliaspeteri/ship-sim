import React, { useMemo, useState } from 'react';
import EnvironmentControls from './EnvironmentControls';
import useStore from '../store';
import { getSimulationLoop } from '../simulation';
import socketManager from '../networking/socket';
import {
  AISTarget,
  ARPASettings,
  ARPATarget,
  DEFAULT_ARPA_SETTINGS,
  EBL,
  GuardZone,
  RadarDisplay,
  RadarSettings,
  RadarTarget,
  VRM,
} from './radar';
import { TelegraphLever } from './TelegraphLever';
import { HelmControl } from './HelmControl';
import RudderAngleIndicator from './RudderAngleIndicator';
import { RUDDER_STALL_ANGLE_DEG, clampRudderAngle } from '../constants/vessel';
import { ChatPanel } from './ChatPanel';
import EventLog from './EventLog';
import { MarineRadio } from './radio/index';
import { ConningDisplay } from './bridge/ConningDisplay';
import { AlarmIndicator } from './alarms/AlarmIndicator';
import { positionToXY } from '../lib/position';

type HudTab =
  | 'navigation'
  | 'conning'
  | 'weather'
  | 'systems'
  | 'spaces'
  | 'chat'
  | 'events'
  | 'radio'
  | 'radar'
  | 'alarms'
  | 'admin';

const tabs: { id: HudTab; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'conning', label: 'Conning' },
  { id: 'weather', label: 'Weather' },
  { id: 'systems', label: 'Systems' },
  { id: 'spaces', label: 'Spaces' },
  { id: 'chat', label: 'Chat' },
  { id: 'events', label: 'Events' },
  { id: 'radio', label: 'Radio' },
  { id: 'radar', label: 'Radar' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'admin', label: 'Admin' },
];

const formatDegrees = (rad?: number) => {
  if (rad === undefined) return '—';
  const deg = (rad * 180) / Math.PI;
  const normalized = ((deg % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
};

const toDegrees = (rad?: number) => ((rad ?? 0) * 180) / Math.PI;

const formatBearing = (deg?: number) => {
  if (deg === undefined || Number.isNaN(deg)) return '—';
  const normalized = ((deg % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
};

const formatKnots = (val?: number) =>
  `${((val || 0) * 1.94384).toFixed(1)} kts`;

interface HudDrawerProps {
  onOpenSpaces?: () => void;
}

export function HudDrawer({ onOpenSpaces }: HudDrawerProps) {
  const [tab, setTab] = useState<HudTab | null>(null);
  const [pressedTab, setPressedTab] = useState<HudTab | null>(null);
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);
  const roles = useStore(state => state.roles);
  const setNotice = useStore(state => state.setNotice);
  const otherVessels = useStore(state => state.otherVessels);
  const currentVesselId = useStore(state => state.currentVesselId);
  const spaceId = useStore(state => state.spaceId);
  const isAdmin = roles.includes('admin');
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
  const [radarEbl, setRadarEbl] = useState<EBL>({ active: false, angle: 0 });
  const [radarVrm, setRadarVrm] = useState<VRM>({
    active: false,
    distance: 0,
  });
  const [radarGuardZone, setRadarGuardZone] = useState<GuardZone>({
    active: false,
    startAngle: 320,
    endAngle: 40,
    innerRange: 0.5,
    outerRange: 3,
  });
  const [radarArpaSettings, setRadarArpaSettings] = useState<ARPASettings>(
    DEFAULT_ARPA_SETTINGS,
  );
  const [radarArpaEnabled, setRadarArpaEnabled] = useState(false);
  const [radarArpaTargets, setRadarArpaTargets] = useState<ARPATarget[]>([]);
  const [throttleLocal, setThrottleLocal] = useState(controls?.throttle || 0);
  const [rudderAngleLocal, setRudderAngleLocal] = useState(
    controls?.rudderAngle || 0,
  );
  const [ballastLocal, setBallastLocal] = useState(controls?.ballast ?? 0.5);
  const [adminTargetId, setAdminTargetId] = useState<string>('');
  const [adminLat, setAdminLat] = useState('');
  const [adminLon, setAdminLon] = useState('');
  const shortId = React.useCallback(
    (id: string) => (id.length > 10 ? `${id.slice(0, 10)}…` : id),
    [],
  );
  const toWorldVelocity = React.useCallback(
    (v: typeof vessel | (typeof otherVessels)[string]) => {
      const h = v?.orientation?.heading ?? 0;
      const surge = v?.velocity?.surge ?? 0;
      const sway = v?.velocity?.sway ?? 0;
      const wx = surge * Math.cos(h) - sway * Math.sin(h);
      const wy = surge * Math.sin(h) + sway * Math.cos(h);
      const speed = Math.sqrt(wx ** 2 + wy ** 2);
      const course = ((Math.atan2(wx, wy) * 180) / Math.PI + 360) % 360;
      return { wx, wy, speed, course };
    },
    [],
  );
  const ownShipData = useMemo(() => {
    const headingRad = vessel.orientation.heading || 0;
    const headingDeg = ((toDegrees(headingRad) % 360) + 360) % 360;
    const headingCompass = (((90 - headingDeg) % 360) + 360) % 360;
    const surge = vessel.velocity.surge || 0;
    const sway = vessel.velocity.sway || 0;
    const worldX = surge * Math.cos(headingRad) - sway * Math.sin(headingRad);
    const worldY = surge * Math.sin(headingRad) + sway * Math.cos(headingRad);
    const speedMs = Math.sqrt(worldX ** 2 + worldY ** 2);
    const courseDeg =
      ((Math.atan2(worldX, worldY) * 180) / Math.PI + 360) % 360;
    return {
      position: {
        lat: vessel.position.lat ?? 0,
        lon: vessel.position.lon ?? 0,
      },
      heading: headingCompass,
      speed: Number.isFinite(speedMs) ? speedMs * 1.94384 : 0,
      course: Number.isFinite(courseDeg) ? courseDeg : 0,
    };
  }, [
    vessel.orientation.heading,
    vessel.position.lat,
    vessel.position.lon,
    vessel.velocity.surge,
    vessel.velocity.sway,
  ]);

  const radarEnvironment = useMemo(
    () => ({
      seaState: Math.max(0, Math.min(10, environment.seaState ?? 0)),
      rainIntensity: Math.max(
        0,
        Math.min(
          10,
          Math.round((environment.precipitationIntensity ?? 0) * 10),
        ),
      ),
      visibility: environment.visibility ?? 10,
    }),
    [
      environment.precipitationIntensity,
      environment.seaState,
      environment.visibility,
    ],
  );

  const radarTargets: RadarTarget[] = useMemo(() => {
    const results: RadarTarget[] = [];
    const ownXY = positionToXY({
      lat: vessel.position.lat,
      lon: vessel.position.lon,
    });

    Object.entries(otherVessels || {}).forEach(([id, other]) => {
      if (!other) return;
      if (id === currentVesselId) return;
      const targetSpace =
        (other as { spaceId?: string }).spaceId || spaceId || 'global';
      if (targetSpace !== (spaceId || 'global')) return;

      const properties = (
        other as { properties?: { length?: number; beam?: number } }
      ).properties;

      const otherXY = positionToXY({
        lat: other.position?.lat ?? vessel.position.lat,
        lon: other.position?.lon ?? vessel.position.lon,
      });
      const deltaX = otherXY.x - ownXY.x;
      const deltaY = otherXY.y - ownXY.y;
      const distanceMeters = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      if (!Number.isFinite(distanceMeters) || distanceMeters < 1) return;

      const distanceNm = distanceMeters / 1852;
      const bearingDeg =
        ((Math.atan2(deltaX, deltaY) * 180) / Math.PI + 360) % 360;
      const { speed, course } = toWorldVelocity(other);
      const size = Math.min(
        1,
        Math.max(
          0.25,
          ((properties?.length ?? properties?.beam ?? 80) as number) / 250,
        ),
      );

      results.push({
        id,
        distance: distanceNm,
        bearing: bearingDeg,
        size,
        speed: speed * 1.94384,
        course,
        type: 'ship',
        isTracked: false,
      });
    });

    return results;
  }, [
    currentVesselId,
    otherVessels,
    spaceId,
    toWorldVelocity,
    vessel.orientation.heading,
    vessel.position.lat,
    vessel.position.lon,
  ]);

  const aisTargets: AISTarget[] = useMemo(() => {
    const results: AISTarget[] = [];
    const ownXY = positionToXY({
      lat: vessel.position.lat,
      lon: vessel.position.lon,
    });

    Object.entries(otherVessels || {}).forEach(([id, other]) => {
      if (!other) return;
      if (id === currentVesselId) return;
      const targetSpace =
        (other as { spaceId?: string }).spaceId || spaceId || 'global';
      if (targetSpace !== (spaceId || 'global')) return;

      const otherXY = positionToXY({
        lat: other.position?.lat ?? vessel.position.lat,
        lon: other.position?.lon ?? vessel.position.lon,
      });
      const deltaX = otherXY.x - ownXY.x;
      const deltaY = otherXY.y - ownXY.y;
      const distanceMeters = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      if (!Number.isFinite(distanceMeters) || distanceMeters < 1) return;

      const distanceNm = distanceMeters / 1852;
      const bearingDeg =
        ((Math.atan2(deltaX, deltaY) * 180) / Math.PI + 360) % 360;
      const { speed, course } = toWorldVelocity(other);
      const headingDeg =
        ((toDegrees(other.orientation?.heading ?? 0) % 360) + 360) % 360;
      const headingCompass = (((90 - headingDeg) % 360) + 360) % 360;
      const label =
        other.helm?.username ||
        (other as { properties?: { name?: string } }).properties?.name ||
        `Vessel ${shortId(id)}`;

      results.push({
        mmsi: id,
        name: label,
        distance: distanceNm,
        bearing: bearingDeg,
        course,
        speed: speed * 1.94384,
        heading: headingCompass,
        vesselType: 'ship',
      });
    });

    return results;
  }, [
    currentVesselId,
    otherVessels,
    shortId,
    spaceId,
    toWorldVelocity,
    vessel.position.lat,
    vessel.position.lon,
  ]);

  const conningData = useMemo(() => {
    const now = new Date();
    const timeOfDay =
      environment.timeOfDay ?? now.getUTCHours() + now.getUTCMinutes() / 60;
    const headingDeg =
      ((toDegrees(vessel.orientation.heading) % 360) + 360) % 360;
    const headingCompass = (((90 - headingDeg) % 360) + 360) % 360;
    const windDeg = ((toDegrees(environment.wind.direction) % 360) + 360) % 360;
    const windCompass = (((90 - windDeg) % 360) + 360) % 360;
    const surge = vessel.velocity.surge ?? 0;
    const sway = vessel.velocity.sway ?? 0;
    const speedMs = Math.sqrt(surge ** 2 + sway ** 2);
    const speedKts = speedMs * 1.94384;
    const yawRateDeg = toDegrees(vessel.angularVelocity?.yaw ?? 0);
    const rudderDeg = toDegrees(vessel.controls.rudderAngle ?? 0);
    const throttle = vessel.controls.throttle ?? 0;
    const pitch = Math.round(Math.min(100, Math.max(0, (throttle + 1) * 50)));
    const rpm = vessel.engineState?.rpm ?? 0;
    const rateOfTurn = Math.min(100, Math.abs(yawRateDeg) * 4);

    const windSpeedKts = (environment.wind.speed ?? 0) * 1.94384;

    return {
      date: now.toISOString().slice(0, 10),
      time: formatTime(timeOfDay),
      latitude: vessel.position.lat ?? 0,
      longitude: vessel.position.lon ?? 0,
      heading: Math.round(headingCompass),
      windDirection: Math.round(windCompass),
      windSpeed: Number(windSpeedKts.toFixed(1)),
      pitch: Number(toDegrees(vessel.orientation.pitch).toFixed(1)),
      roll: Number(toDegrees(vessel.orientation.roll).toFixed(1)),
      dopplerLog: Number(speedKts.toFixed(1)),
      rateOfTurn: Number(rateOfTurn.toFixed(1)),
      propellers: [
        {
          azimuth: Math.round(rudderDeg),
          pitch,
          rpm: Math.round(rpm),
          side: 'port' as const,
        },
        {
          azimuth: Math.round(rudderDeg),
          pitch,
          rpm: Math.round(rpm),
          side: 'starboard' as const,
        },
      ],
      dials: [
        Math.round(vessel.engineState?.temperature ?? 0),
        Math.round((vessel.engineState?.oilPressure ?? 0) * 10),
      ],
    };
  }, [
    environment.timeOfDay,
    environment.wind.direction,
    environment.wind.speed,
    vessel.angularVelocity?.yaw,
    vessel.controls.rudderAngle,
    vessel.controls.throttle,
    vessel.engineState?.oilPressure,
    vessel.engineState?.rpm,
    vessel.engineState?.temperature,
    vessel.orientation.heading,
    vessel.orientation.pitch,
    vessel.orientation.roll,
    vessel.position.lat,
    vessel.position.lon,
    vessel.velocity.surge,
    vessel.velocity.sway,
  ]);

  const alarmItems = useMemo(() => {
    const base = [
      { key: 'engineOverheat', label: 'Engine Overheat', severity: 'critical' },
      {
        key: 'lowOilPressure',
        label: 'Low Oil Pressure',
        severity: 'critical',
      },
      { key: 'lowFuel', label: 'Low Fuel', severity: 'warning' },
      { key: 'fireDetected', label: 'Fire Detected', severity: 'critical' },
      { key: 'collisionAlert', label: 'Collision Alert', severity: 'critical' },
      {
        key: 'stabilityWarning',
        label: 'Stability Warning',
        severity: 'warning',
      },
      { key: 'generatorFault', label: 'Generator Fault', severity: 'warning' },
      { key: 'blackout', label: 'Blackout', severity: 'critical' },
    ];

    const items = base.map(item => ({
      key: item.key,
      label: item.label,
      severity: item.severity as 'warning' | 'critical',
      active: Boolean(
        (vessel.alarms as unknown as Record<string, boolean | undefined>)?.[
          item.key
        ],
      ),
    }));

    const otherAlarms = vessel.alarms?.otherAlarms || {};
    Object.entries(otherAlarms).forEach(([key, active]) => {
      items.push({
        key,
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, c => c.toUpperCase()),
        severity: 'warning',
        active: Boolean(active),
      });
    });

    return items;
  }, [vessel.alarms]);

  const adminTargets = useMemo(() => {
    const targets: Array<{
      id: string;
      label: string;
      position: {
        x?: number;
        y?: number;
        lat?: number;
        lon?: number;
      };
    }> = [];

    if (currentVesselId) {
      const ownXY = positionToXY({
        lat: vessel.position.lat,
        lon: vessel.position.lon,
      });
      targets.push({
        id: currentVesselId,
        label: `My vessel (${shortId(currentVesselId)})`,
        position: {
          x: ownXY.x,
          y: ownXY.y,
          lat: vessel.position.lat,
          lon: vessel.position.lon,
        },
      });
    }

    Object.entries(otherVessels || {}).forEach(([id, other]) => {
      if (!other) return;
      const targetSpace =
        (other as { spaceId?: string }).spaceId || spaceId || 'global';
      if (targetSpace !== (spaceId || 'global')) return;
      const otherXY = positionToXY({
        lat: other.position?.lat ?? vessel.position.lat,
        lon: other.position?.lon ?? vessel.position.lon,
      });
      targets.push({
        id,
        label: `Vessel ${shortId(id)}`,
        position: {
          x: otherXY.x,
          y: otherXY.y,
          lat: other.position?.lat,
          lon: other.position?.lon,
        },
      });
    });

    return targets;
  }, [
    currentVesselId,
    otherVessels,
    spaceId,
    vessel.position.lat,
    vessel.position.lon,
  ]);

  const selectedAdminTarget = useMemo(
    () => adminTargets.find(target => target.id === adminTargetId),
    [adminTargetId, adminTargets],
  );

  const formatCoord = (value?: number, digits = 1) =>
    Number.isFinite(value) ? (value as number).toFixed(digits) : '—';

  React.useEffect(() => {
    if (!isAdmin) return;
    if (!adminTargetId && adminTargets.length > 0) {
      setAdminTargetId(adminTargets[0].id);
    }
  }, [adminTargetId, adminTargets, isAdmin]);

  const adminTargetRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isAdmin) return;
    if (!adminTargetId) return;
    if (adminTargetRef.current === adminTargetId) return;
    adminTargetRef.current = adminTargetId;
    setAdminLat('');
    setAdminLon('');
  }, [adminTargetId, isAdmin]);

  // sync controls from store
  React.useEffect(() => {
    if (!controls) return;
    setThrottleLocal(controls.throttle ?? 0);
    setRudderAngleLocal(controls.rudderAngle ?? 0);
    setBallastLocal(controls.ballast ?? 0.5);
  }, [controls?.throttle, controls?.rudderAngle, controls?.ballast, controls]);

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
        label: 'COG',
        value: formatBearing(ownShipData.course),
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
        value: `${((vessel.controls.ballast ?? 0.5) * 100).toFixed(0)}%`,
      },
      {
        label: 'Lat',
        value: vessel.position.lat.toFixed(6),
      },
      {
        label: 'Lon',
        value: vessel.position.lon.toFixed(6),
      },
      {
        label: 'Yaw rate',
        value: `${toDegrees(vessel.angularVelocity?.yaw ?? 0).toFixed(2)}°/s`,
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
      ownShipData.course,
      vessel.angularVelocity?.yaw,
      vessel.controls.ballast,
      vessel.controls.rudderAngle,
      vessel.controls.throttle,
      vessel.orientation.heading,
      vessel.position.lat,
      vessel.position.lon,
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

  const visibleTabs = useMemo(
    () => (isAdmin ? tabs : tabs.filter(t => t.id !== 'admin')),
    [isAdmin],
  );

  const handleAdminMove = () => {
    if (!adminTargetId) return;
    const hasEmpty = adminLat.trim() === '' || adminLon.trim() === '';
    if (hasEmpty) {
      setNotice({
        type: 'error',
        message: 'Enter coordinates before moving the vessel.',
      });
      return;
    }
    const payload = {
      lat: Number(adminLat),
      lon: Number(adminLon),
    };
    const values = Object.values(payload);
    if (values.some(val => Number.isNaN(val))) {
      setNotice({
        type: 'error',
        message: 'Enter valid coordinates for the move.',
      });
      return;
    }
    socketManager.sendAdminVesselMove(adminTargetId, payload);
  };

  const handleAdminMoveToSelf = () => {
    if (!adminTargetId) return;
    socketManager.sendAdminVesselMove(adminTargetId, {
      lat: vessel.position.lat,
      lon: vessel.position.lon,
    });
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 text-white">
      {tab ? (
        <div className="mx-auto mb-3 w-[95vw] max-w-6xl rounded-2xl border border-teal-900/40 bg-gradient-to-br from-[#0b1627]/95 via-[#0d2238]/92 to-[#0b1f36]/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur pointer-events-auto max-h-[85vh] overflow-y-auto">
          {tab === 'navigation' ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {navStats.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-teal-900/40 bg-[#10233a]/70 px-3 py-2 transition-colors hover:border-teal-700/60"
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
              <div className="flex flex-wrap items-start gap-4 rounded-xl border border-teal-900/40 bg-[#0f1f33]/70 p-3">
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
                    onChange={e => {
                      const next = parseFloat(e.target.value);
                      setBallastLocal(Number.isNaN(next) ? 0.5 : next);
                    }}
                    className="w-40 accent-blue-500"
                  />
                  <div className="text-xs text-gray-300">
                    {(ballastLocal * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'conning' ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-3 text-sm text-gray-300">
              <div className="overflow-x-auto">
                <div className="min-w-[820px]">
                  <ConningDisplay data={conningData} />
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'weather' ? <EnvironmentControls /> : null}
          {tab === 'systems' ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-3 text-sm text-gray-300">
              Systems, fuel, ballast, and electrics panels will live here. For
              now, use the dashboard controls while this drawer is built out.
            </div>
          ) : null}
          {tab === 'chat' ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-2 text-sm">
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
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-3 text-sm text-gray-300">
              <EventLog />
            </div>
          ) : null}
          {tab === 'radio' ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-3 text-sm text-gray-300 flex justify-center">
              <div className="scale-90 md:scale-95 origin-top">
                <MarineRadio width={440} height={320} />
              </div>
            </div>
          ) : null}
          {tab === 'radar' ? (
            <div className="space-y-3 rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-3 text-sm text-gray-300">
              <div className="flex flex-col items-center gap-3">
                <RadarDisplay
                  size={320}
                  className="max-w-[860px] mx-auto"
                  initialSettings={radarSettings}
                  onSettingsChange={setRadarSettings}
                  ebl={radarEbl}
                  onEblChange={setRadarEbl}
                  vrm={radarVrm}
                  onVrmChange={setRadarVrm}
                  guardZone={radarGuardZone}
                  onGuardZoneChange={setRadarGuardZone}
                  arpaSettings={radarArpaSettings}
                  onArpaSettingsChange={setRadarArpaSettings}
                  arpaEnabled={radarArpaEnabled}
                  onArpaEnabledChange={setRadarArpaEnabled}
                  arpaTargets={radarArpaTargets}
                  onArpaTargetsChange={setRadarArpaTargets}
                  liveTargets={radarTargets}
                  aisTargets={aisTargets}
                  environment={radarEnvironment}
                  ownShipData={ownShipData}
                />
              </div>
            </div>
          ) : null}
          {tab === 'alarms' ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-4 text-sm text-gray-300">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {alarmItems.map(item => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2"
                  >
                    <AlarmIndicator
                      active={item.active}
                      label={item.label}
                      severity={item.severity}
                      size={18}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {tab === 'admin' && isAdmin ? (
            <div className="rounded-lg border border-teal-900/40 bg-[#0f1f33]/70 p-4 text-sm text-gray-300">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">
                    Vessel Selection
                  </div>
                  <select
                    className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={adminTargetId}
                    onChange={e => setAdminTargetId(e.target.value)}
                  >
                    {adminTargets.map(target => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-xs text-gray-300">
                    Latitude
                    <input
                      className="mt-1 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={adminLat}
                      onChange={e => setAdminLat(e.target.value)}
                      placeholder={formatCoord(
                        selectedAdminTarget?.position.lat,
                        6,
                      )}
                    />
                    <div className="mt-1 text-[11px] text-gray-500">
                      Current:{' '}
                      {formatCoord(selectedAdminTarget?.position.lat, 6)}
                    </div>
                  </label>
                  <label className="text-xs text-gray-300">
                    Longitude
                    <input
                      className="mt-1 w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={adminLon}
                      onChange={e => setAdminLon(e.target.value)}
                      placeholder={formatCoord(
                        selectedAdminTarget?.position.lon,
                        6,
                      )}
                    />
                    <div className="mt-1 text-[11px] text-gray-500">
                      Current:{' '}
                      {formatCoord(selectedAdminTarget?.position.lon, 6)}
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold hover:bg-emerald-700"
                    onClick={handleAdminMove}
                  >
                    Move vessel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                    onClick={handleAdminMoveToSelf}
                  >
                    Move to my position
                  </button>
                </div>

                <div className="text-xs text-gray-400">
                  Drag-and-drop moves for spectator mode are planned; this panel
                  is the temporary admin move tool.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="pointer-events-auto bg-gradient-to-r from-[#0b1627]/95 via-[#0b1c30]/94 to-[#0a2238]/95 backdrop-blur border-t border-teal-900/40 px-6 py-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          HUD • {mode === 'spectator' ? 'Spectator' : 'Player'} mode
          {helm?.userId ? ` • Helm: ${helm.username || helm.userId}` : ''}
          {spaceId ? ` • Space: ${spaceId}` : ''}
        </div>
        <div className="flex gap-3">
          {visibleTabs.map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={() => setPressedTab(t.id)}
              onMouseUp={() => setPressedTab(null)}
              onClick={() => handleTabClick(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
                tab === t.id || pressedTab === t.id
                  ? 'bg-gradient-to-b from-[#1b9aaa] to-[#0f7c8a] text-white shadow-md shadow-teal-900/40 border-teal-700/70'
                  : 'bg-slate-800/90 text-gray-200 hover:bg-slate-700/80 border-slate-700/70'
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
