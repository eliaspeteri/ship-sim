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
import {
  courseFromWorldVelocity,
  positionToXY,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../lib/position';
import { getApiBase } from '../lib/api';
import {
  applyOffsetToTimeOfDay,
  estimateTimeZoneOffsetHours,
  formatTimeOfDay,
} from '../lib/time';
import styles from './HudDrawer.module.css';

type HudTab =
  | 'navigation'
  | 'conning'
  | 'weather'
  | 'systems'
  | 'missions'
  | 'replay'
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
  { id: 'missions', label: 'Missions' },
  { id: 'replay', label: 'Replay' },
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
const formatKnotsValue = (val?: number) => `${(val || 0).toFixed(1)} kts`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const COURSE_SPEED_THRESHOLD = 0.05;

interface HudDrawerProps {
  onOpenSpaces?: () => void;
}

type EconomyTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  vesselId?: string | null;
  meta?: Record<string, unknown> | null;
};

export function HudDrawer({ onOpenSpaces }: HudDrawerProps) {
  const [tab, setTab] = useState<HudTab | null>(null);
  const [pressedTab, setPressedTab] = useState<HudTab | null>(null);
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);
  const roles = useStore(state => state.roles);
  const sessionUserId = useStore(state => state.sessionUserId);
  const crewIds = useStore(state => state.crewIds);
  const crewNames = useStore(state => state.crewNames);
  const setNotice = useStore(state => state.setNotice);
  const account = useStore(state => state.account);
  const setAccount = useStore(state => state.setAccount);
  const missions = useStore(state => state.missions);
  const missionAssignments = useStore(state => state.missionAssignments);
  const upsertMissionAssignment = useStore(
    state => state.upsertMissionAssignment,
  );
  const socketLatencyMs = useStore(state => state.socketLatencyMs);
  const replay = useStore(state => state.replay);
  const startReplayRecording = useStore(state => state.startReplayRecording);
  const stopReplayRecording = useStore(state => state.stopReplayRecording);
  const startReplayPlayback = useStore(state => state.startReplayPlayback);
  const stopReplayPlayback = useStore(state => state.stopReplayPlayback);
  const clearReplay = useStore(state => state.clearReplay);
  const otherVessels = useStore(state => state.otherVessels);
  const currentVesselId = useStore(state => state.currentVesselId);
  const spaceId = useStore(state => state.spaceId);
  const isAdmin = roles.includes('admin');
  const helm = vessel.helm;
  const stations = vessel.stations;
  const controls = useStore(state => state.vessel.controls);
  const baseRadarSettings = useMemo(
    () => ({
      range: 6,
      gain: 70,
      seaClutter: 50,
      rainClutter: 50,
      heading: 0,
      orientation: 'head-up' as const,
      trails: true,
      trailDuration: 30,
      nightMode: false,
    }),
    [],
  );
  const [radarSettingsX, setRadarSettingsX] = useState<RadarSettings>({
    ...baseRadarSettings,
    band: 'X',
  });
  const [radarSettingsS, setRadarSettingsS] = useState<RadarSettings>({
    ...baseRadarSettings,
    band: 'S',
  });
  const [radarEblX, setRadarEblX] = useState<EBL>({ active: false, angle: 0 });
  const [radarEblS, setRadarEblS] = useState<EBL>({ active: false, angle: 0 });
  const [radarVrmX, setRadarVrmX] = useState<VRM>({
    active: false,
    distance: 0,
  });
  const [radarVrmS, setRadarVrmS] = useState<VRM>({
    active: false,
    distance: 0,
  });
  const [radarGuardZoneX, setRadarGuardZoneX] = useState<GuardZone>({
    active: false,
    startAngle: 320,
    endAngle: 40,
    innerRange: 0.5,
    outerRange: 3,
  });
  const [radarGuardZoneS, setRadarGuardZoneS] = useState<GuardZone>({
    active: false,
    startAngle: 320,
    endAngle: 40,
    innerRange: 0.5,
    outerRange: 3,
  });
  const [radarArpaSettingsX, setRadarArpaSettingsX] = useState<ARPASettings>(
    DEFAULT_ARPA_SETTINGS,
  );
  const [radarArpaSettingsS, setRadarArpaSettingsS] = useState<ARPASettings>(
    DEFAULT_ARPA_SETTINGS,
  );
  const [radarArpaEnabledX, setRadarArpaEnabledX] = useState(false);
  const [radarArpaEnabledS, setRadarArpaEnabledS] = useState(false);
  const [radarArpaTargetsX, setRadarArpaTargetsX] = useState<ARPATarget[]>([]);
  const [radarArpaTargetsS, setRadarArpaTargetsS] = useState<ARPATarget[]>([]);
  const [throttleLocal, setThrottleLocal] = useState(controls?.throttle || 0);
  const [rudderAngleLocal, setRudderAngleLocal] = useState(
    controls?.rudderAngle || 0,
  );
  const [ballastLocal, setBallastLocal] = useState(controls?.ballast ?? 0.5);
  const [adminTargetId, setAdminTargetId] = useState<string>('');
  const [adminLat, setAdminLat] = useState('');
  const [adminLon, setAdminLon] = useState('');
  const [missionError, setMissionError] = useState<string | null>(null);
  const [missionBusyId, setMissionBusyId] = useState<string | null>(null);
  const [economyTransactions, setEconomyTransactions] = useState<
    EconomyTransaction[]
  >([]);
  const [economyLoading, setEconomyLoading] = useState(false);
  const [economyError, setEconomyError] = useState<string | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);
  const shortId = React.useCallback(
    (id: string) => (id.length > 10 ? `${id.slice(0, 10)}…` : id),
    [],
  );
  const helmStation = stations?.helm || helm;
  const engineStation = stations?.engine;
  const radioStation = stations?.radio;
  const isHelm = Boolean(
    sessionUserId && (helmStation?.userId || null) === sessionUserId,
  );
  const isEngine = Boolean(
    sessionUserId && (engineStation?.userId || null) === sessionUserId,
  );
  /*   const isRadio = Boolean(
    sessionUserId && (radioStation?.userId || null) === sessionUserId,
  ); */
  const canAdjustThrottle = isEngine || (!engineStation?.userId && isHelm);
  const canAdjustRudder = isHelm;
  const canAcceptMissions = roles.includes('player') || roles.includes('admin');
  const engineState = vessel.engineState;
  const electrical = vessel.electricalSystem;
  const stability = vessel.stability;
  const fuelPercent = clamp01(engineState?.fuelLevel ?? 0);
  const loadPercent = clamp01(engineState?.load ?? 0);
  const batteryPercent = clamp01(electrical?.batteryLevel ?? 0);
  const ballastPercent = clamp01(ballastLocal);
  const waterDepth = vessel.waterDepth ?? environment.waterDepth;
  const underKeel =
    waterDepth !== undefined
      ? waterDepth - (vessel.properties.draft ?? 0)
      : undefined;
  const engineRunning =
    Boolean(engineState?.running) || (vessel.controls.throttle ?? 0) > 0.05;
  const generatorOnline = Boolean(electrical?.generatorRunning);
  const powerBalance =
    (electrical?.generatorOutput ?? 0) - (electrical?.powerConsumption ?? 0);
  const crewRoster = useMemo(() => {
    return (crewIds || []).map(id => ({
      id,
      name: crewNames?.[id] || id,
    }));
  }, [crewIds, crewNames]);
  const stationByUser = useMemo(() => {
    const map = new Map<string, string[]>();
    const register = (userId: string | null | undefined, label: string) => {
      if (!userId) return;
      const existing = map.get(userId) || [];
      existing.push(label);
      map.set(userId, existing);
    };
    register(helmStation?.userId, 'Helm');
    register(engineStation?.userId, 'Engine');
    register(radioStation?.userId, 'Radio');
    return map;
  }, [engineStation?.userId, helmStation?.userId, radioStation?.userId]);
  const currentVector = useMemo(() => {
    const speed = environment.current?.speed ?? 0;
    const direction = environment.current?.direction ?? 0;
    return {
      x: speed * Math.cos(direction),
      y: speed * Math.sin(direction),
    };
  }, [environment.current?.direction, environment.current?.speed]);
  const toWorldVelocity = React.useCallback(
    (v: typeof vessel | (typeof otherVessels)[string]) => {
      const heading = v?.orientation?.heading ?? 0;
      const base = worldVelocityFromBody(heading, v?.velocity ?? {});
      const combined = {
        x: base.x + currentVector.x,
        y: base.y + currentVector.y,
      };
      const speed = speedFromWorldVelocity(combined);
      const course = courseFromWorldVelocity(combined);
      return { wx: combined.x, wy: combined.y, speed, course };
    },
    [currentVector.x, currentVector.y],
  );

  const timeZone = useMemo(
    () => estimateTimeZoneOffsetHours(vessel.position.lon),
    [vessel.position.lon],
  );
  const localTimeOfDay = useMemo(() => {
    const base = environment.timeOfDay ?? 12;
    if (!timeZone) return base;
    return applyOffsetToTimeOfDay(base, timeZone.offsetHours);
  }, [environment.timeOfDay, timeZone]);
  const timeZoneLabel = timeZone?.label || 'UTC';
  const ownShipData = useMemo(() => {
    const headingRad = vessel.orientation.heading || 0;
    const headingDeg = ((toDegrees(headingRad) % 360) + 360) % 360;
    const headingCompass = (((90 - headingDeg) % 360) + 360) % 360;
    const { speed: speedMs, course: courseDeg } = toWorldVelocity(vessel);
    const stableCourse =
      speedMs > COURSE_SPEED_THRESHOLD && Number.isFinite(courseDeg)
        ? courseDeg
        : headingCompass;
    return {
      position: {
        lat: vessel.position.lat ?? 0,
        lon: vessel.position.lon ?? 0,
      },
      heading: headingCompass,
      speed: Number.isFinite(speedMs) ? speedMs * 1.94384 : 0,
      course: Number.isFinite(stableCourse) ? stableCourse : headingCompass,
    };
  }, [
    toWorldVelocity,
    vessel.orientation.heading,
    vessel.position.lat,
    vessel.position.lon,
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
    const { speed: speedMs } = toWorldVelocity(vessel);
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
      time: formatTimeOfDay(timeOfDay),
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
    toWorldVelocity,
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
    if (!canAdjustThrottle && !canAdjustRudder) return;
    const simulationLoop = getSimulationLoop();
    try {
      const clampedRudder = clampRudderAngle(rudderAngleLocal);
      const nextControls: {
        throttle?: number;
        rudderAngle?: number;
        ballast?: number;
      } = {};
      if (canAdjustThrottle) {
        nextControls.throttle = throttleLocal;
        nextControls.ballast = ballastLocal;
      }
      if (canAdjustRudder) {
        nextControls.rudderAngle = clampedRudder;
      }
      simulationLoop.applyControls(nextControls);
      socketManager.sendControlUpdate(
        nextControls.throttle,
        nextControls.rudderAngle,
        nextControls.ballast,
      );
    } catch (error) {
      console.error('Error applying controls from HUD:', error);
    }
  }, [
    ballastLocal,
    canAdjustRudder,
    canAdjustThrottle,
    controls,
    mode,
    rudderAngleLocal,
    throttleLocal,
  ]);

  const navStats = useMemo(
    () => [
      {
        label: 'COG',
        value: formatBearing(ownShipData.course),
      },
      {
        label: 'SOG',
        value: formatKnotsValue(ownShipData.speed),
        detail: `STW ${formatKnots(vessel.velocity.surge)}`,
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
        value: formatTimeOfDay(localTimeOfDay),
        detail: timeZoneLabel,
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
      localTimeOfDay,
      timeZoneLabel,
      ownShipData.course,
      ownShipData.speed,
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

  const assignmentsByMission = useMemo(() => {
    const map = new Map<string, (typeof missionAssignments)[number]>();
    missionAssignments.forEach(assignment => {
      map.set(assignment.missionId, assignment);
    });
    return map;
  }, [missionAssignments]);

  const activeAssignments = useMemo(
    () =>
      missionAssignments.filter(assignment =>
        ['assigned', 'in_progress', 'completed'].includes(assignment.status),
      ),
    [missionAssignments],
  );

  const nextRankAt = Math.max(1000, account.rank * 1000);
  const rankProgress =
    nextRankAt > 0 ? Math.min(account.experience / nextRankAt, 1) : 0;
  const xpToNext = Math.max(0, nextRankAt - account.experience);

  const replayDuration = useMemo(() => {
    if (replay.frames.length < 2) return 0;
    const start = replay.frames[0]?.timestamp ?? 0;
    const end = replay.frames[replay.frames.length - 1]?.timestamp ?? 0;
    return Math.max(0, end - start);
  }, [replay.frames]);

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

  const handleAssignMission = async (missionId: string) => {
    if (!missionId) return;
    setMissionError(null);
    setMissionBusyId(missionId);
    try {
      const res = await fetch(`${apiBase}/api/missions/${missionId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vesselId: currentVesselId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      if (data?.assignment) {
        upsertMissionAssignment(data.assignment);
      }
      setNotice({
        type: 'info',
        message: 'Mission assignment updated.',
      });
    } catch (err) {
      console.error('Failed to assign mission', err);
      setMissionError(
        err instanceof Error ? err.message : 'Failed to assign mission.',
      );
    } finally {
      setMissionBusyId(null);
    }
  };

  React.useEffect(() => {
    if (tab !== 'missions') return;
    let active = true;
    const loadEconomy = async () => {
      setEconomyLoading(true);
      setEconomyError(null);
      try {
        const res = await fetch(`${apiBase}/api/economy/summary`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (!active) return;
        if (data?.profile) {
          setAccount(data.profile);
        }
        setEconomyTransactions(
          Array.isArray(data?.transactions) ? data.transactions : [],
        );
      } catch (err) {
        if (!active) return;
        console.error('Failed to load economy summary', err);
        setEconomyError(
          err instanceof Error
            ? err.message
            : 'Unable to load economy summary.',
        );
      } finally {
        if (active) {
          setEconomyLoading(false);
        }
      }
    };
    void loadEconomy();
    return () => {
      active = false;
    };
  }, [apiBase, setAccount, tab]);

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
    <div className={styles.hudRoot}>
      {tab ? (
        <div className={styles.hudPanel}>
          {tab === 'navigation' ? (
            <div className={styles.sectionGrid}>
              <div className={`${styles.sectionGrid} ${styles.twoCol}`}>
                <div className={styles.statGrid}>
                  {navStats.map(stat => (
                    <div key={stat.label} className={styles.statCard}>
                      <div className={styles.statLabel}>{stat.label}</div>
                      <div className={styles.statValue}>{stat.value}</div>
                      {stat.detail ? (
                        <div className={styles.statDetail}>{stat.detail}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className={styles.controlCluster}>
                  <TelegraphLever
                    label="Throttle"
                    value={throttleLocal}
                    min={-1}
                    max={1}
                    onChange={setThrottleLocal}
                    disabled={!canAdjustThrottle}
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
                      setRudderAngleLocal(
                        clampRudderAngle((deg * Math.PI) / 180),
                      )
                    }
                    disabled={!canAdjustRudder}
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
                      disabled={!canAdjustThrottle}
                      onChange={e => {
                        const next = parseFloat(e.target.value);
                        setBallastLocal(Number.isNaN(next) ? 0.5 : next);
                      }}
                      className={`w-40 accent-blue-500 ${!canAdjustThrottle ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <div className="text-xs text-gray-300">
                      {(ballastLocal * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className="flex items-center justify-between">
                  <div className={styles.sectionTitle}>Crew & stations</div>
                  <div className={styles.sectionSub}>
                    {crewRoster.length || 0} aboard
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className={styles.sectionTitle}>Roster</div>
                    <div className="mt-2 space-y-2">
                      {crewRoster.length === 0 ? (
                        <div className="text-xs text-gray-500">
                          Awaiting crew assignments.
                        </div>
                      ) : (
                        crewRoster.map(member => (
                          <div key={member.id} className={styles.crewRow}>
                            <div className="text-sm font-semibold text-white">
                              {member.name}
                            </div>
                            <div className="flex items-center gap-1">
                              {(stationByUser.get(member.id) || []).map(
                                station => (
                                  <span
                                    key={`${member.id}-${station}`}
                                    className={styles.badge}
                                  >
                                    {station}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>Stations</div>
                    <div className="mt-2 space-y-2">
                      {[
                        {
                          key: 'helm',
                          label: 'Helm',
                          station: helmStation,
                          description: 'Steer the vessel and manage heading.',
                        },
                        {
                          key: 'engine',
                          label: 'Engine',
                          station: engineStation,
                          description: 'Throttle and ballast controls.',
                        },
                        {
                          key: 'radio',
                          label: 'Radio',
                          station: radioStation,
                          description: 'Communications and broadcasts.',
                        },
                      ].map(item => {
                        const holderId = item.station?.userId || null;
                        const holderName =
                          item.station?.username || holderId || 'Unassigned';
                        const isSelf =
                          sessionUserId && holderId === sessionUserId;
                        const canClaim =
                          (sessionUserId && crewIds.includes(sessionUserId)) ||
                          isAdmin;
                        const isHeldByOther = Boolean(
                          holderId &&
                            sessionUserId &&
                            holderId !== sessionUserId,
                        );
                        const action: 'claim' | 'release' = isSelf
                          ? 'release'
                          : 'claim';
                        const disabled =
                          !canClaim || (isHeldByOther && !isAdmin);
                        return (
                          <div key={item.key} className={styles.crewRow}>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {holderId
                                  ? `Held by ${holderName}`
                                  : 'Unassigned'}
                              </div>
                              <div className={styles.stationHint}>
                                {item.description}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                socketManager.requestStation(
                                  item.key as 'helm' | 'engine' | 'radio',
                                  action,
                                )
                              }
                              className={`${styles.stationButton} ${
                                disabled ? styles.stationButtonDisabled : ''
                              }`}
                            >
                              {isSelf ? 'Release' : 'Claim'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'conning' ? (
            <div className={styles.sectionCard}>
              <div className="overflow-x-auto">
                <div className="min-w-[820px]">
                  <ConningDisplay data={conningData} />
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'weather' ? <EnvironmentControls /> : null}
          {tab === 'systems' ? (
            <div className={styles.sectionGrid}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>Propulsion & fuel</div>
                  <span className={styles.badge}>
                    {engineRunning ? 'Engine online' : 'Engine idle'}
                  </span>
                </div>
                <div className={styles.systemGrid}>
                  <SystemMeter
                    label="Fuel"
                    value={`${(fuelPercent * 100).toFixed(0)}%`}
                    detail={`${engineState.fuelConsumption.toFixed(1)} kg/h`}
                    percent={fuelPercent}
                  />
                  <SystemMeter
                    label="Engine load"
                    value={`${(loadPercent * 100).toFixed(0)}%`}
                    detail={`${engineState.rpm.toFixed(0)} rpm`}
                    percent={loadPercent}
                  />
                  <SystemMeter
                    label="Temperature"
                    value={`${engineState.temperature.toFixed(0)}°C`}
                    detail={`Oil ${engineState.oilPressure.toFixed(1)} bar`}
                  />
                  <div className={styles.systemCard}>
                    <div className={styles.systemLabel}>Ballast</div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={ballastPercent}
                      disabled={!canAdjustThrottle}
                      onChange={e => {
                        const next = parseFloat(e.target.value);
                        setBallastLocal(Number.isNaN(next) ? 0.5 : next);
                      }}
                      className={styles.systemRange}
                    />
                    <div className={styles.systemMeta}>
                      {(ballastPercent * 100).toFixed(0)}% ballast
                    </div>
                  </div>
                </div>
                {!canAdjustThrottle ? (
                  <div className={styles.sectionSub}>
                    Claim the engine station to adjust ballast and throttle.
                  </div>
                ) : null}
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>Electrical</div>
                  <span className={styles.badge}>
                    {generatorOnline ? 'Generator online' : 'Generator offline'}
                  </span>
                </div>
                <div className={styles.systemGrid}>
                  <SystemMeter
                    label="Battery"
                    value={`${(batteryPercent * 100).toFixed(0)}%`}
                    detail={`${electrical.mainBusVoltage.toFixed(0)} V bus`}
                    percent={batteryPercent}
                  />
                  <SystemMeter
                    label="Generation"
                    value={`${electrical.generatorOutput.toFixed(0)} kW`}
                    detail={`Load ${electrical.powerConsumption.toFixed(0)} kW`}
                  />
                  <SystemMeter
                    label="Balance"
                    value={`${powerBalance.toFixed(0)} kW`}
                    detail={
                      powerBalance >= 0 ? 'Surplus power' : 'Power deficit'
                    }
                  />
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>Stability & load</div>
                  <span className={styles.badge}>
                    Draft {vessel.properties.draft.toFixed(1)} m
                  </span>
                </div>
                <div className={styles.statGrid}>
                  {[
                    {
                      label: 'GM',
                      value: `${stability.metacentricHeight.toFixed(2)} m`,
                    },
                    {
                      label: 'Trim',
                      value: `${stability.trim.toFixed(2)}°`,
                    },
                    {
                      label: 'List',
                      value: `${stability.list.toFixed(2)}°`,
                    },
                    {
                      label: 'Displacement',
                      value: `${(vessel.properties.mass / 1000).toFixed(0)} t`,
                    },
                    {
                      label: 'Block coeff',
                      value: vessel.properties.blockCoefficient.toFixed(2),
                    },
                    {
                      label: 'Depth',
                      value:
                        waterDepth !== undefined
                          ? `${waterDepth.toFixed(1)} m`
                          : '—',
                    },
                    {
                      label: 'Under keel',
                      value:
                        underKeel !== undefined
                          ? `${underKeel.toFixed(1)} m`
                          : '—',
                    },
                    {
                      label: 'Beam',
                      value: `${vessel.properties.beam.toFixed(1)} m`,
                    },
                  ].map(stat => (
                    <div key={stat.label} className={styles.statCard}>
                      <div className={styles.statLabel}>{stat.label}</div>
                      <div className={styles.statValue}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'missions' ? (
            <div className={styles.sectionGrid}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Account snapshot</div>
                <div className={styles.accountGrid}>
                  <div className={styles.accountCard}>
                    <div className={styles.accountLabel}>Rank</div>
                    <div className={styles.accountValue}>{account.rank}</div>
                  </div>
                  <div className={styles.accountCard}>
                    <div className={styles.accountLabel}>Credits</div>
                    <div className={styles.accountValue}>
                      {account.credits.toFixed(0)}
                    </div>
                  </div>
                  <div className={styles.accountCard}>
                    <div className={styles.accountLabel}>Experience</div>
                    <div className={styles.accountValue}>
                      {account.experience.toFixed(0)}
                    </div>
                  </div>
                  <div className={styles.accountCard}>
                    <div className={styles.accountLabel}>Safety</div>
                    <div className={styles.accountValue}>
                      {account.safetyScore.toFixed(2)}
                    </div>
                  </div>
                  <div className={styles.accountCard}>
                    <div className={styles.accountLabel}>Latency</div>
                    <div className={styles.accountValue}>
                      {socketLatencyMs !== null
                        ? `${Math.round(socketLatencyMs)} ms`
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className={styles.progressRow}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(rankProgress * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <div className={styles.progressMeta}>
                    Next rank in {xpToNext.toFixed(0)} XP
                  </div>
                </div>
                <div className={styles.sectionSub}>
                  Missions award credits and XP. Operating costs and port fees
                  deduct credits while you sail; safety penalties apply for
                  collisions or speed violations in regulated spaces.
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Recent activity</div>
                {economyLoading ? (
                  <div className={styles.sectionSub}>Loading economy...</div>
                ) : null}
                {economyError ? (
                  <div className={styles.sectionSub}>{economyError}</div>
                ) : null}
                {!economyLoading && economyTransactions.length === 0 ? (
                  <div className={styles.sectionSub}>
                    No recent economy activity yet.
                  </div>
                ) : null}
                {economyTransactions.length > 0 ? (
                  <div className={styles.transactionList}>
                    {economyTransactions.slice(0, 8).map(tx => (
                      <div key={tx.id} className={styles.transactionRow}>
                        <div>
                          <div className={styles.transactionLabel}>
                            {formatTransactionReason(tx.reason)}
                          </div>
                          <div className={styles.transactionMeta}>
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={`${styles.transactionAmount} ${
                            tx.amount >= 0
                              ? styles.transactionPositive
                              : styles.transactionNegative
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {tx.amount.toFixed(0)} cr
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Active assignments</div>
                {activeAssignments.length === 0 ? (
                  <div className={styles.sectionSub}>
                    No active missions. Accept a contract to start.
                  </div>
                ) : (
                  <div className={styles.assignmentList}>
                    {activeAssignments.map(assignment => {
                      const mission =
                        assignment.mission ||
                        missions.find(m => m.id === assignment.missionId);
                      return (
                        <div
                          key={assignment.id}
                          className={styles.assignmentCard}
                        >
                          <div>
                            <div className={styles.assignmentTitle}>
                              {mission?.name || 'Mission'}
                            </div>
                            <div className={styles.assignmentMeta}>
                              Status: {assignment.status.replace('_', ' ')}
                            </div>
                          </div>
                          <div className={styles.assignmentMeta}>
                            Reward: {mission?.rewardCredits ?? 0} cr
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Available missions</div>
                {missionError ? (
                  <div className={styles.sectionSub}>{missionError}</div>
                ) : null}
                {missions.length === 0 ? (
                  <div className={styles.sectionSub}>
                    No contracts published for this space yet.
                  </div>
                ) : (
                  <div className={styles.missionList}>
                    {missions.map(mission => {
                      const assignment = assignmentsByMission.get(mission.id);
                      const locked = account.rank < mission.requiredRank;
                      const disabled =
                        !canAcceptMissions ||
                        locked ||
                        Boolean(assignment) ||
                        missionBusyId === mission.id;
                      return (
                        <div key={mission.id} className={styles.missionCard}>
                          <div className={styles.missionHeader}>
                            <div>
                              <div className={styles.missionTitle}>
                                {mission.name}
                              </div>
                              <div className={styles.missionMeta}>
                                {mission.description || '—'}
                              </div>
                            </div>
                            <div className={styles.missionMeta}>
                              Rank {mission.requiredRank}
                            </div>
                          </div>
                          <div className={styles.missionFooter}>
                            <div className={styles.missionMeta}>
                              Reward {mission.rewardCredits} cr
                            </div>
                            <button
                              type="button"
                              className={styles.missionButton}
                              disabled={disabled}
                              onClick={() =>
                                void handleAssignMission(mission.id)
                              }
                            >
                              {assignment
                                ? 'Assigned'
                                : locked
                                  ? 'Locked'
                                  : missionBusyId === mission.id
                                    ? 'Assigning…'
                                    : 'Accept'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {tab === 'replay' ? (
            <div className={styles.sectionGrid}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>Replay console</div>
                <div className={styles.replayMeta}>
                  {replay.frames.length} frames •{' '}
                  {(replayDuration / 1000).toFixed(1)}s recorded
                </div>
                <div className={styles.replayControls}>
                  <button
                    type="button"
                    className={styles.replayButton}
                    onClick={
                      replay.recording
                        ? stopReplayRecording
                        : startReplayRecording
                    }
                    disabled={replay.playing}
                  >
                    {replay.recording ? 'Stop recording' : 'Start recording'}
                  </button>
                  <button
                    type="button"
                    className={styles.replayButtonSecondary}
                    onClick={
                      replay.playing ? stopReplayPlayback : startReplayPlayback
                    }
                    disabled={replay.frames.length < 2 || replay.recording}
                  >
                    {replay.playing ? 'Stop playback' : 'Play ghost'}
                  </button>
                  <button
                    type="button"
                    className={styles.replayButtonDanger}
                    onClick={clearReplay}
                    disabled={replay.recording || replay.frames.length === 0}
                  >
                    Clear recording
                  </button>
                </div>
                <div className={styles.sectionSub}>
                  Ghost playback overlays the last run. Recordings pause vessel
                  control updates while active.
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'chat' ? (
            <div className={styles.sectionCard}>
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
            <div className={styles.sectionCard}>
              <EventLog />
            </div>
          ) : null}
          {tab === 'radio' ? (
            <div className={styles.sectionCard}>
              <div className="flex justify-center">
                <div className="scale-90 md:scale-95 origin-top">
                  <MarineRadio width={440} height={320} />
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'radar' ? (
            <div className={styles.sectionCard}>
              <div className={styles.radarGrid}>
                <div className="space-y-2">
                  <div className={styles.radarTitle}>X-band</div>
                  <RadarDisplay
                    size={320}
                    className="max-w-[860px] mx-auto"
                    initialSettings={radarSettingsX}
                    onSettingsChange={setRadarSettingsX}
                    ebl={radarEblX}
                    onEblChange={setRadarEblX}
                    vrm={radarVrmX}
                    onVrmChange={setRadarVrmX}
                    guardZone={radarGuardZoneX}
                    onGuardZoneChange={setRadarGuardZoneX}
                    arpaSettings={radarArpaSettingsX}
                    onArpaSettingsChange={setRadarArpaSettingsX}
                    arpaEnabled={radarArpaEnabledX}
                    onArpaEnabledChange={setRadarArpaEnabledX}
                    arpaTargets={radarArpaTargetsX}
                    onArpaTargetsChange={setRadarArpaTargetsX}
                    liveTargets={radarTargets}
                    aisTargets={aisTargets}
                    environment={radarEnvironment}
                    ownShipData={ownShipData}
                  />
                </div>
                <div className="space-y-2">
                  <div className={styles.radarTitle}>S-band</div>
                  <RadarDisplay
                    size={320}
                    className="max-w-[860px] mx-auto"
                    initialSettings={radarSettingsS}
                    onSettingsChange={setRadarSettingsS}
                    ebl={radarEblS}
                    onEblChange={setRadarEblS}
                    vrm={radarVrmS}
                    onVrmChange={setRadarVrmS}
                    guardZone={radarGuardZoneS}
                    onGuardZoneChange={setRadarGuardZoneS}
                    arpaSettings={radarArpaSettingsS}
                    onArpaSettingsChange={setRadarArpaSettingsS}
                    arpaEnabled={radarArpaEnabledS}
                    onArpaEnabledChange={setRadarArpaEnabledS}
                    arpaTargets={radarArpaTargetsS}
                    onArpaTargetsChange={setRadarArpaTargetsS}
                    liveTargets={radarTargets}
                    aisTargets={aisTargets}
                    environment={radarEnvironment}
                    ownShipData={ownShipData}
                  />
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'alarms' ? (
            <div className={styles.sectionCard}>
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
            <div className={styles.sectionCard}>
              <div className={styles.adminPanel}>
                <div>
                  <div className={styles.sectionTitle}>Vessel Selection</div>
                  <select
                    className={styles.adminSelect}
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

                <div className={styles.adminGrid}>
                  <label className={styles.adminLabel}>
                    Latitude
                    <input
                      className={styles.adminInput}
                      value={adminLat}
                      onChange={e => setAdminLat(e.target.value)}
                      placeholder={formatCoord(
                        selectedAdminTarget?.position.lat,
                        6,
                      )}
                    />
                    <div className={styles.adminHint}>
                      Current:{' '}
                      {formatCoord(selectedAdminTarget?.position.lat, 6)}
                    </div>
                  </label>
                  <label className={styles.adminLabel}>
                    Longitude
                    <input
                      className={styles.adminInput}
                      value={adminLon}
                      onChange={e => setAdminLon(e.target.value)}
                      placeholder={formatCoord(
                        selectedAdminTarget?.position.lon,
                        6,
                      )}
                    />
                    <div className={styles.adminHint}>
                      Current:{' '}
                      {formatCoord(selectedAdminTarget?.position.lon, 6)}
                    </div>
                  </label>
                </div>

                <div className={styles.adminActions}>
                  <button
                    type="button"
                    className={styles.adminButton}
                    onClick={handleAdminMove}
                  >
                    Move vessel
                  </button>
                  <button
                    type="button"
                    className={styles.adminButtonSecondary}
                    onClick={handleAdminMoveToSelf}
                  >
                    Move to my position
                  </button>
                </div>

                <div className={styles.sectionSub}>
                  Drag-and-drop moves for spectator mode are planned; this panel
                  is the temporary admin move tool.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={styles.hudFooter}>
        <div className={styles.footerMeta}>
          HUD • {mode === 'spectator' ? 'Spectator' : 'Player'} mode
          {helmStation?.userId
            ? ` • Helm: ${helmStation.username || helmStation.userId}`
            : ''}
          {spaceId ? ` • Space: ${spaceId}` : ''}
        </div>
        <div className={styles.tabRow}>
          {visibleTabs.map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={() => setPressedTab(t.id)}
              onMouseUp={() => setPressedTab(null)}
              onClick={() => handleTabClick(t.id)}
              className={`${styles.tabButton} ${
                tab === t.id || pressedTab === t.id
                  ? styles.tabButtonActive
                  : ''
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

const TRANSACTION_REASON_LABELS: Record<string, string> = {
  operating_cost: 'Operating cost',
  port_fee: 'Port fee',
  collision: 'Collision penalty',
  speed_violation: 'Speed violation',
  near_miss: 'Near miss',
  mission_reward: 'Mission reward',
};

const formatTransactionReason = (reason?: string) => {
  if (!reason) return 'Economy update';
  return TRANSACTION_REASON_LABELS[reason] || reason.replace(/_/g, ' ');
};

const SystemMeter = ({
  label,
  value,
  detail,
  percent,
}: {
  label: string;
  value: string;
  detail?: string;
  percent?: number;
}) => {
  const clamped = percent !== undefined ? clamp01(percent) : undefined;
  const tone =
    clamped !== undefined
      ? clamped <= 0.15
        ? styles.meterFillDanger
        : clamped <= 0.35
          ? styles.meterFillWarn
          : styles.meterFillOk
      : undefined;

  return (
    <div className={styles.systemCard}>
      <div className={styles.systemLabel}>{label}</div>
      <div className={styles.systemValue}>{value}</div>
      {clamped !== undefined ? (
        <div className={styles.meter}>
          <div
            className={`${styles.meterFill} ${tone || ''}`}
            style={{ width: `${Math.round(clamped * 100)}%` }}
          />
        </div>
      ) : null}
      {detail ? <div className={styles.systemMeta}>{detail}</div> : null}
    </div>
  );
};
