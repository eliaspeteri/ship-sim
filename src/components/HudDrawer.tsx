import React, { useMemo, useState } from 'react';
import { getSimulationLoop } from '../simulation';
import { socketManager } from '../networking/socket';
import {
  AISTarget,
  ARPASettings,
  ARPATarget,
  DEFAULT_ARPA_SETTINGS,
  EBL,
  GuardZone,
  RadarSettings,
  RadarTarget,
  VRM,
} from './radar';
import {
  courseFromWorldVelocity,
  distanceMeters,
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
import { computeRepairCost, normalizeDamageState } from '../lib/damage';
import { hudStyles as styles } from './hud/hudStyles';
import { HudAdminPanel } from './hud/panels/HudAdminPanel';
import { HudAlarmsPanel } from './hud/panels/HudAlarmsPanel';
import { HudChatPanel } from './hud/panels/HudChatPanel';
import { HudConningPanel } from './hud/panels/HudConningPanel';
import { HudNavControls } from './hud/panels/HudNavControls';
import { HudCrewPanel } from './hud/panels/HudCrewPanel';
import { HudEcdisPanel } from './hud/panels/HudEcdisPanel';
import { HudEventsPanel } from './hud/panels/HudEventsPanel';
import { HudMissionsPanel } from './hud/panels/HudMissionsPanel';
import { HudNavigationPanel } from './hud/panels/HudNavigationPanel';
import { HudRadarPanel } from './hud/panels/HudRadarPanel';
import { HudRadioPanel } from './hud/panels/HudRadioPanel';
import { HudReplayPanel } from './hud/panels/HudReplayPanel';
import { HudSounderPanel } from './hud/panels/HudSounderPanel';
import { HudSystemsPanel } from './hud/panels/HudSystemsPanel';
import { HudVesselsPanel } from './hud/panels/HudVesselsPanel';
import { HudWeatherPanel } from './hud/panels/HudWeatherPanel';
import { HudPhysicsInspectorPanel } from './hud/PhysicsInspectorPanel';
import {
  projectVesselsFromOwnShip,
  resolveActiveSpaceId,
  selectInSpaceVessels,
} from '../features/sim/selectors/vesselSelectors';
import {
  COMPASS_ZERO_OFFSET_DEG,
  CONTROL_SEND_MIN_INTERVAL_MS,
  COURSE_SPEED_THRESHOLD_MS,
  DEFAULT_BALLAST,
  DEFAULT_GUARD_ZONE,
  DEFAULT_RADAR_EBL,
  DEFAULT_RADAR_SETTINGS,
  DEFAULT_RADAR_VRM,
  DEFAULT_SPACE_ID,
  DEG_PER_RAD,
  DRAFT_DIVISOR_EPSILON,
  DRAFT_MASS_BALLAST_FACTOR,
  DRAFT_MASS_BASE_FACTOR,
  DRAFT_NEUTRAL_SCALE_BASE,
  DRAFT_NEUTRAL_SCALE_RANGE,
  DRAFT_WATER_DENSITY,
  ENGINE_RUNNING_THROTTLE_THRESHOLD,
  FULL_CIRCLE_DEG,
  HUD_PORTS,
  HUD_TABS,
  KNOTS_PER_MS,
  LAT_LON_DECIMALS,
  MIN_RANK_XP,
  MINUTES_PER_HOUR,
  NAV_BALLAST_DECIMALS,
  NAV_RUDDER_DECIMALS,
  NAV_THROTTLE_DECIMALS,
  NAV_YAW_RATE_DECIMALS,
  OIL_PRESSURE_SCALE,
  PERCENT_SCALE,
  PITCH_MAX,
  PITCH_MIN,
  PITCH_THROTTLE_OFFSET,
  PITCH_THROTTLE_SCALE,
  RADAR_MIN_DISTANCE_M,
  RADAR_RAIN_INTENSITY_MAX,
  RADAR_RAIN_SCALE,
  RADAR_SEA_STATE_MAX,
  RADAR_TARGET_SIZE_DEFAULT_METERS,
  RADAR_TARGET_SIZE_MAX,
  RADAR_TARGET_SIZE_MIN,
  RADAR_TARGET_SIZE_SCALE_METERS,
  RADAR_VISIBILITY_DEFAULT,
  RANK_XP_MULTIPLIER,
  RATE_OF_TURN_MAX,
  RATE_OF_TURN_SCALE,
  REPLAY_MIN_FRAMES,
  WAVE_HEIGHT_DECIMALS,
} from './hud/constants';
import {
  clamp01,
  formatBearing,
  formatDegrees,
  formatKnots,
  formatKnotsValue,
  toDegrees,
} from './hud/format';
import { EconomyPort, HudTab } from './hud/types';
import {
  HudControlUpdate,
  useHudControlsSync,
} from '../features/sim/hooks/useHudControlsSync';
import { useHudFleetData } from '../features/sim/hooks/useHudFleetData';
import { useHudMissionData } from '../features/sim/hooks/useHudMissionData';
import { useHudStoreSnapshot } from '../features/sim/hooks/useHudStoreSnapshot';

interface HudDrawerProps {
  onOpenSpaces?: () => void;
}

export function HudDrawer({ onOpenSpaces }: HudDrawerProps) {
  const [tab, setTab] = useState<HudTab | null>(null);
  const [pressedTab, setPressedTab] = useState<HudTab | null>(null);
  const hudFooterRef = React.useRef<HTMLDivElement | null>(null);
  const [hudFooterHeight, setHudFooterHeight] = useState(0);
  const {
    vessel,
    environment,
    mode,
    roles,
    sessionUserId,
    crewIds,
    crewNames,
    setNotice,
    account,
    setAccount,
    setPhysicsParams,
    missions,
    missionAssignments,
    upsertMissionAssignment,
    socketLatencyMs,
    replay,
    startReplayRecording,
    stopReplayRecording,
    startReplayPlayback,
    stopReplayPlayback,
    clearReplay,
    otherVessels,
    currentVesselId,
    spaceId,
    controls,
  } = useHudStoreSnapshot();
  const isAdmin = roles.includes('admin');
  const showPhysicsInspector =
    process.env.NEXT_PUBLIC_PHYSICS_INSPECTOR === 'true' ||
    process.env.NODE_ENV !== 'production';
  const showDebugTab = showPhysicsInspector && isAdmin;
  const helm = vessel.helm;
  const stations = vessel.stations;
  const baseRadarSettings = useMemo(() => DEFAULT_RADAR_SETTINGS, []);
  const [radarSettings, setRadarSettings] = useState<RadarSettings>({
    ...baseRadarSettings,
    band: 'X',
  });
  const [radarEbl, setRadarEbl] = useState<EBL>(DEFAULT_RADAR_EBL);
  const [radarVrm, setRadarVrm] = useState<VRM>(DEFAULT_RADAR_VRM);
  const [radarGuardZone, setRadarGuardZone] =
    useState<GuardZone>(DEFAULT_GUARD_ZONE);
  const [radarArpaSettings, setRadarArpaSettings] = useState<ARPASettings>(
    DEFAULT_ARPA_SETTINGS,
  );
  const [radarArpaEnabled, setRadarArpaEnabled] = useState(false);
  const [radarArpaTargets, setRadarArpaTargets] = useState<ARPATarget[]>([]);
  const [adminTargetId, setAdminTargetId] = useState<string>('');
  const [adminLat, setAdminLat] = useState('');
  const [adminLon, setAdminLon] = useState('');
  const apiBase = useMemo(() => getApiBase(), []);
  const { fleet, fleetLoading, fleetError, fleetPorts } = useHudFleetData({
    apiBase,
    tab,
    fallbackPorts: HUD_PORTS,
  });
  const shortId = React.useCallback(
    (id: string) => (id.length > 10 ? `${id.slice(0, 10)}…` : id),
    [],
  );
  const resolveNearestPort = React.useCallback(
    (lat: number, lon: number) => {
      let nearest: EconomyPort | null = null;
      let nearestDistance = Infinity;
      for (const port of fleetPorts) {
        const dist = distanceMeters(
          { lat, lon },
          { lat: port.position.lat, lon: port.position.lon },
        );
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearest = port;
        }
      }
      return {
        port: nearest,
        distance: Number.isFinite(nearestDistance) ? nearestDistance : null,
      };
    },
    [fleetPorts],
  );
  const normalizedSpaceId = spaceId || DEFAULT_SPACE_ID;
  const fleetInSpace = fleet.filter(
    entry => (entry.spaceId || DEFAULT_SPACE_ID) === normalizedSpaceId,
  );
  const fleetOtherSpace = fleet.filter(
    entry => (entry.spaceId || DEFAULT_SPACE_ID) !== normalizedSpaceId,
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
  const dispatchControlUpdate = React.useCallback(
    (nextControls: HudControlUpdate) => {
      const simulationLoop = getSimulationLoop();
      simulationLoop.applyControls(nextControls);
      socketManager.sendControlUpdate(
        nextControls.throttle,
        nextControls.rudderAngle,
        nextControls.ballast,
      );
    },
    [],
  );
  const {
    throttleLocal,
    setThrottleLocal,
    rudderAngleLocal,
    setRudderAngleLocal,
    ballastLocal,
    setBallastLocal,
  } = useHudControlsSync({
    controls,
    mode,
    canAdjustThrottle,
    canAdjustRudder,
    defaultBallast: DEFAULT_BALLAST,
    minSendIntervalMs: CONTROL_SEND_MIN_INTERVAL_MS,
    failureState: vessel.failureState,
    damageState: vessel.damageState,
    dispatchControlUpdate,
  });
  const {
    missionError,
    missionBusyId,
    economyTransactions,
    economyLoading,
    economyError,
    handleAssignMission,
  } = useHudMissionData({
    apiBase,
    tab,
    currentVesselId,
    setAccount,
    setNotice,
    upsertMissionAssignment,
  });
  const engineState = vessel.engineState;
  const electrical = vessel.electricalSystem;
  const stability = vessel.stability;
  const damageState = normalizeDamageState(vessel.damageState);
  const repairCost = computeRepairCost(damageState);
  const speedMs = Math.hypot(
    vessel.velocity?.surge ?? 0,
    vessel.velocity?.sway ?? 0,
  );
  const fuelPercent = clamp01(engineState?.fuelLevel ?? 0);
  const loadPercent = clamp01(engineState?.load ?? 0);
  const batteryPercent = clamp01(electrical?.batteryLevel ?? 0);
  const ballastPercent = clamp01(ballastLocal);
  const draftEstimate = useMemo(() => {
    const mass = vessel.properties.mass ?? 0;
    const length = vessel.properties.length ?? 0;
    const beam = vessel.properties.beam ?? 0;
    const block = vessel.properties.blockCoefficient ?? 0;
    if (
      !Number.isFinite(mass) ||
      !Number.isFinite(length) ||
      !Number.isFinite(beam) ||
      !Number.isFinite(block) ||
      length <= 0 ||
      beam <= 0 ||
      block <= 0
    ) {
      return vessel.properties.draft ?? 0;
    }
    const ballast = clamp01(ballastLocal);
    const effectiveMass =
      mass * (DRAFT_MASS_BASE_FACTOR + ballast * DRAFT_MASS_BALLAST_FACTOR);
    const neutralDraft =
      effectiveMass /
      (DRAFT_WATER_DENSITY * length * beam * block + DRAFT_DIVISOR_EPSILON);
    const targetDraft =
      neutralDraft *
      (DRAFT_NEUTRAL_SCALE_BASE + ballast * DRAFT_NEUTRAL_SCALE_RANGE);
    return Number.isFinite(targetDraft)
      ? targetDraft
      : (vessel.properties.draft ?? 0);
  }, [
    ballastLocal,
    vessel.properties.beam,
    vessel.properties.blockCoefficient,
    vessel.properties.draft,
    vessel.properties.length,
    vessel.properties.mass,
  ]);
  const waterDepth = vessel.waterDepth ?? environment.waterDepth;
  const depthValue =
    waterDepth !== undefined && Number.isFinite(waterDepth)
      ? waterDepth
      : undefined;
  const draftForUnderKeel = Number.isFinite(draftEstimate)
    ? draftEstimate
    : (vessel.properties.draft ?? 0);
  const underKeel =
    waterDepth !== undefined ? waterDepth - draftForUnderKeel : undefined;
  const engineRunning =
    Boolean(engineState?.running) ||
    (vessel.controls.throttle ?? 0) > ENGINE_RUNNING_THROTTLE_THRESHOLD;
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
    const headingDeg =
      ((toDegrees(headingRad) % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const headingCompass =
      (((COMPASS_ZERO_OFFSET_DEG - headingDeg) % FULL_CIRCLE_DEG) +
        FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const { speed: speedMs, course: courseDeg } = toWorldVelocity(vessel);
    const stableCourse =
      speedMs > COURSE_SPEED_THRESHOLD_MS && Number.isFinite(courseDeg)
        ? courseDeg
        : headingCompass;
    return {
      position: {
        lat: vessel.position.lat ?? 0,
        lon: vessel.position.lon ?? 0,
      },
      heading: headingCompass,
      speed: Number.isFinite(speedMs) ? speedMs * KNOTS_PER_MS : 0,
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
      seaState: Math.max(
        0,
        Math.min(RADAR_SEA_STATE_MAX, environment.seaState ?? 0),
      ),
      rainIntensity: Math.max(
        0,
        Math.min(
          RADAR_RAIN_INTENSITY_MAX,
          Math.round(
            (environment.precipitationIntensity ?? 0) * RADAR_RAIN_SCALE,
          ),
        ),
      ),
      visibility: environment.visibility ?? RADAR_VISIBILITY_DEFAULT,
    }),
    [
      environment.precipitationIntensity,
      environment.seaState,
      environment.visibility,
    ],
  );

  const activeSpaceId = useMemo(() => resolveActiveSpaceId(spaceId), [spaceId]);

  const inSpaceVessels = useMemo(
    () =>
      selectInSpaceVessels({
        otherVessels,
        spaceId: activeSpaceId,
        excludeVesselId: currentVesselId,
      }),
    [activeSpaceId, currentVesselId, otherVessels],
  );

  const projectedVessels = useMemo(
    () =>
      projectVesselsFromOwnShip({
        ownPosition: {
          lat: vessel.position.lat,
          lon: vessel.position.lon,
        },
        vessels: inSpaceVessels,
      }),
    [inSpaceVessels, vessel.position.lat, vessel.position.lon],
  );

  const radarTargets: RadarTarget[] = useMemo(() => {
    return projectedVessels
      .filter(
        projected =>
          Number.isFinite(projected.distanceMeters) &&
          projected.distanceMeters >= RADAR_MIN_DISTANCE_M,
      )
      .map(projected => {
        const { speed, course } = toWorldVelocity(projected.vessel);
        const properties = projected.vessel.properties;
        const size = Math.min(
          RADAR_TARGET_SIZE_MAX,
          Math.max(
            RADAR_TARGET_SIZE_MIN,
            ((properties?.length ??
              properties?.beam ??
              RADAR_TARGET_SIZE_DEFAULT_METERS) as number) /
              RADAR_TARGET_SIZE_SCALE_METERS,
          ),
        );

        return {
          id: projected.id,
          distance: projected.distanceNm,
          bearing: projected.bearingDeg,
          size,
          speed: speed * KNOTS_PER_MS,
          course,
          type: 'ship' as const,
          isTracked: false,
        };
      });
  }, [projectedVessels, toWorldVelocity]);

  const aisTargets: AISTarget[] = useMemo(() => {
    return projectedVessels
      .filter(
        projected =>
          Number.isFinite(projected.distanceMeters) &&
          projected.distanceMeters >= RADAR_MIN_DISTANCE_M,
      )
      .map(projected => {
        const { speed, course } = toWorldVelocity(projected.vessel);
        const other = projected.vessel;
        const id = projected.id;
        const headingDeg =
          ((toDegrees(other.orientation?.heading ?? 0) % FULL_CIRCLE_DEG) +
            FULL_CIRCLE_DEG) %
          FULL_CIRCLE_DEG;
        const headingCompass =
          (((COMPASS_ZERO_OFFSET_DEG - headingDeg) % FULL_CIRCLE_DEG) +
            FULL_CIRCLE_DEG) %
          FULL_CIRCLE_DEG;
        const label =
          other.helm?.username ||
          (other as { properties?: { name?: string } }).properties?.name ||
          `Vessel ${shortId(id)}`;

        return {
          mmsi: id,
          name: label,
          distance: projected.distanceNm,
          bearing: projected.bearingDeg,
          course,
          speed: speed * KNOTS_PER_MS,
          heading: headingCompass,
          vesselType: 'ship',
        };
      });
  }, [projectedVessels, shortId, toWorldVelocity]);

  const conningData = useMemo(() => {
    const now = new Date();
    const timeOfDay =
      environment.timeOfDay ??
      now.getUTCHours() + now.getUTCMinutes() / MINUTES_PER_HOUR;
    const headingDeg =
      ((toDegrees(vessel.orientation.heading) % FULL_CIRCLE_DEG) +
        FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const headingCompass =
      (((COMPASS_ZERO_OFFSET_DEG - headingDeg) % FULL_CIRCLE_DEG) +
        FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const windDeg =
      ((toDegrees(environment.wind.direction) % FULL_CIRCLE_DEG) +
        FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const windCompass =
      (((COMPASS_ZERO_OFFSET_DEG - windDeg) % FULL_CIRCLE_DEG) +
        FULL_CIRCLE_DEG) %
      FULL_CIRCLE_DEG;
    const { speed: speedMs } = toWorldVelocity(vessel);
    const speedKts = speedMs * KNOTS_PER_MS;
    const yawRateDeg = toDegrees(vessel.angularVelocity?.yaw ?? 0);
    const rudderDeg = toDegrees(vessel.controls.rudderAngle ?? 0);
    const throttle = vessel.controls.throttle ?? 0;
    const pitch = Math.round(
      Math.min(
        PITCH_MAX,
        Math.max(
          PITCH_MIN,
          (throttle + PITCH_THROTTLE_OFFSET) * PITCH_THROTTLE_SCALE,
        ),
      ),
    );
    const rpm = vessel.engineState?.rpm ?? 0;
    const rateOfTurn = Math.min(
      RATE_OF_TURN_MAX,
      Math.abs(yawRateDeg) * RATE_OF_TURN_SCALE,
    );

    const windSpeedKts = (environment.wind.speed ?? 0) * KNOTS_PER_MS;

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
        Math.round((vessel.engineState?.oilPressure ?? 0) * OIL_PRESSURE_SCALE),
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
    type CoreAlarmKey =
      | 'engineOverheat'
      | 'lowOilPressure'
      | 'lowFuel'
      | 'fireDetected'
      | 'collisionAlert'
      | 'stabilityWarning'
      | 'generatorFault'
      | 'blackout';
    type AlarmItem = {
      key: string;
      label: string;
      severity: 'warning' | 'critical';
      active: boolean;
    };
    const base: Array<{
      key: CoreAlarmKey;
      label: string;
      severity: 'warning' | 'critical';
    }> = [
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

    const items: AlarmItem[] = base.map(item => ({
      key: item.key,
      label: item.label,
      severity: item.severity,
      active: Boolean(vessel.alarms?.[item.key as CoreAlarmKey]),
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

    projectedVessels.forEach(projected => {
      const id = projected.id;
      const other = projected.vessel;
      targets.push({
        id,
        label: `Vessel ${shortId(id)}`,
        position: {
          x: projected.x,
          y: projected.y,
          lat: other.position?.lat,
          lon: other.position?.lon,
        },
      });
    });

    return targets;
  }, [currentVesselId, projectedVessels, shortId]);

  const selectedAdminTarget = useMemo(
    () => adminTargets.find(target => target.id === adminTargetId),
    [adminTargetId, adminTargets],
  );

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
        value: `${
          (vessel.controls.rudderAngle || 0) * DEG_PER_RAD > 0 ? '+' : ''
        }${((vessel.controls.rudderAngle || 0) * DEG_PER_RAD).toFixed(
          NAV_RUDDER_DECIMALS,
        )}°`,
      },
      {
        label: 'Throttle',
        value: `${((vessel.controls.throttle || 0) * PERCENT_SCALE).toFixed(
          NAV_THROTTLE_DECIMALS,
        )}%`,
      },
      {
        label: 'Ballast',
        value: `${(
          (vessel.controls.ballast ?? DEFAULT_BALLAST) * PERCENT_SCALE
        ).toFixed(NAV_BALLAST_DECIMALS)}%`,
      },
      {
        label: 'Lat',
        value: vessel.position.lat.toFixed(LAT_LON_DECIMALS),
      },
      {
        label: 'Lon',
        value: vessel.position.lon.toFixed(LAT_LON_DECIMALS),
      },
      {
        label: 'Yaw rate',
        value: `${toDegrees(vessel.angularVelocity?.yaw ?? 0).toFixed(
          NAV_YAW_RATE_DECIMALS,
        )}°/s`,
      },
      {
        label: 'Sea state',
        value: `${Math.round(environment.seaState ?? 0)}`,
        detail: `${(environment.waveHeight ?? 0).toFixed(
          WAVE_HEIGHT_DECIMALS,
        )} m waves`,
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

  const nextRankAt = Math.max(MIN_RANK_XP, account.rank * RANK_XP_MULTIPLIER);
  const rankProgress =
    nextRankAt > 0 ? Math.min(account.experience / nextRankAt, 1) : 0;
  const xpToNext = Math.max(0, nextRankAt - account.experience);

  const replayDuration = useMemo(() => {
    if (replay.frames.length < REPLAY_MIN_FRAMES) return 0;
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

  const visibleTabs = useMemo(() => {
    let tabs = HUD_TABS;
    if (!isAdmin) {
      tabs = tabs.filter(t => t.id !== 'admin');
    }
    if (!showDebugTab) {
      tabs = tabs.filter(t => t.id !== 'debug');
    }
    if (mode === 'spectator') {
      tabs = tabs.filter(t => t.id !== 'crew');
    }
    return tabs;
  }, [isAdmin, mode, showDebugTab]);

  React.useEffect(() => {
    if (!tab) return;
    if (!visibleTabs.some(entry => entry.id === tab)) {
      setTab(null);
    }
  }, [tab, visibleTabs]);

  React.useEffect(() => {
    const node = hudFooterRef.current;
    if (!node) return;

    const updateHeight = () => {
      const rect = node.getBoundingClientRect();
      setHudFooterHeight(rect.height || 0);
    };

    updateHeight();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new globalThis.ResizeObserver(updateHeight);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [visibleTabs.length]);

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

  const handlePhysicsParamsApply = React.useCallback(
    (params: Record<string, number>) => {
      setPhysicsParams(params);
      const simulationLoop = getSimulationLoop();
      simulationLoop.refreshPhysicsParams();
    },
    [setPhysicsParams],
  );
  const panelRenderers: Partial<Record<HudTab, () => React.ReactNode>> = {
    vessels: () => (
      <HudVesselsPanel
        fleetLoading={fleetLoading}
        fleetError={fleetError}
        fleetInSpace={fleetInSpace}
        fleetOtherSpace={fleetOtherSpace}
        resolveNearestPort={resolveNearestPort}
        shortId={shortId}
        normalizedSpaceId={normalizedSpaceId}
        otherVessels={otherVessels || {}}
        onJoinVessel={id => {
          socketManager.setJoinPreference('player', true);
          socketManager.requestJoinVessel(id);
        }}
      />
    ),
    navigation: () => <HudNavigationPanel navStats={navStats} />,
    crew: () => (
      <HudCrewPanel
        crewRoster={crewRoster}
        stationByUser={stationByUser}
        helmStation={helmStation}
        engineStation={engineStation}
        radioStation={radioStation}
        sessionUserId={sessionUserId}
        crewIds={crewIds}
        isAdmin={isAdmin}
        onRequestStation={(station, action) =>
          socketManager.requestStation(station, action)
        }
      />
    ),
    ecdis: () => (
      <HudEcdisPanel
        shipPosition={vessel.position}
        heading={vessel.orientation.heading}
      />
    ),
    conning: () => <HudConningPanel conningData={conningData} />,
    sounder: () => <HudSounderPanel depthValue={depthValue} />,
    weather: () => <HudWeatherPanel />,
    systems: () => (
      <HudSystemsPanel
        engineRunning={engineRunning}
        fuelPercent={fuelPercent}
        loadPercent={loadPercent}
        batteryPercent={batteryPercent}
        ballastPercent={ballastPercent}
        canAdjustThrottle={canAdjustThrottle}
        engineState={engineState}
        electrical={electrical}
        powerBalance={powerBalance}
        damageState={damageState}
        repairCost={repairCost}
        speedMs={speedMs}
        draftEstimate={draftEstimate}
        stability={stability}
        vesselProperties={vessel.properties}
        waterDepth={waterDepth}
        underKeel={underKeel}
        setBallastLocal={setBallastLocal}
        onRequestRepair={() =>
          socketManager.requestRepair(currentVesselId || undefined)
        }
      />
    ),
    missions: () => (
      <HudMissionsPanel
        account={account}
        socketLatencyMs={socketLatencyMs}
        rankProgress={rankProgress}
        xpToNext={xpToNext}
        economyLoading={economyLoading}
        economyError={economyError}
        economyTransactions={economyTransactions}
        activeAssignments={activeAssignments}
        missions={missions}
        assignmentsByMission={assignmentsByMission}
        canAcceptMissions={canAcceptMissions}
        missionError={missionError}
        missionBusyId={missionBusyId}
        onAssignMission={missionId => void handleAssignMission(missionId)}
      />
    ),
    replay: () => (
      <HudReplayPanel
        replay={replay}
        replayDuration={replayDuration}
        startReplayRecording={startReplayRecording}
        stopReplayRecording={stopReplayRecording}
        startReplayPlayback={startReplayPlayback}
        stopReplayPlayback={stopReplayPlayback}
        clearReplay={clearReplay}
      />
    ),
    chat: () => (
      <HudChatPanel
        spaceId={spaceId || undefined}
        currentVesselId={currentVesselId || undefined}
      />
    ),
    events: () => <HudEventsPanel />,
    radio: () => <HudRadioPanel />,
    radar: () => (
      <HudRadarPanel
        radarSettings={radarSettings}
        setRadarSettings={setRadarSettings}
        radarEbl={radarEbl}
        setRadarEbl={setRadarEbl}
        radarVrm={radarVrm}
        setRadarVrm={setRadarVrm}
        radarGuardZone={radarGuardZone}
        setRadarGuardZone={setRadarGuardZone}
        radarArpaSettings={radarArpaSettings}
        setRadarArpaSettings={setRadarArpaSettings}
        radarArpaEnabled={radarArpaEnabled}
        setRadarArpaEnabled={setRadarArpaEnabled}
        radarArpaTargets={radarArpaTargets}
        setRadarArpaTargets={setRadarArpaTargets}
        radarTargets={radarTargets}
        aisTargets={aisTargets}
        radarEnvironment={radarEnvironment}
        ownShipData={ownShipData}
      />
    ),
    alarms: () => <HudAlarmsPanel alarmItems={alarmItems} />,
    admin: () =>
      isAdmin ? (
        <div className={styles.sectionGrid}>
          <HudAdminPanel
            adminTargets={adminTargets}
            adminTargetId={adminTargetId}
            setAdminTargetId={setAdminTargetId}
            adminLat={adminLat}
            setAdminLat={setAdminLat}
            adminLon={adminLon}
            setAdminLon={setAdminLon}
            selectedAdminTarget={selectedAdminTarget}
            onMove={handleAdminMove}
            onMoveToSelf={handleAdminMoveToSelf}
          />
        </div>
      ) : null,
    debug: () =>
      showDebugTab ? (
        <div className={styles.sectionGrid}>
          <HudPhysicsInspectorPanel
            vessel={vessel}
            onApplyParams={handlePhysicsParamsApply}
          />
        </div>
      ) : null,
  };
  const activePanel = tab ? (panelRenderers[tab]?.() ?? null) : null;

  return (
    <div className={styles.hudRoot} data-hud-root>
      {tab ? (
        <div
          className={`${styles.hudPanel} ${
            tab === 'navigation' ? styles.hudPanelWide : ''
          }`}
        >
          {activePanel}
        </div>
      ) : null}
      {mode !== 'spectator' && !tab ? (
        <div
          className={`${styles.navControlsDock} ${
            tab ? styles.navControlsDockBehind : ''
          }`}
          style={{
            bottom: `calc(${hudFooterHeight}px + 16px + env(safe-area-inset-bottom))`,
          }}
        >
          <HudNavControls
            throttleLocal={throttleLocal}
            setThrottleLocal={setThrottleLocal}
            rudderAngleLocal={rudderAngleLocal}
            setRudderAngleLocal={setRudderAngleLocal}
            canAdjustThrottle={canAdjustThrottle}
            canAdjustRudder={canAdjustRudder}
          />
        </div>
      ) : null}
      <div className={styles.hudFooter} data-hud-footer ref={hudFooterRef}>
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
