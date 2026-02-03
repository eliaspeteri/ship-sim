import React from 'react';
import EnvironmentControls from '../EnvironmentControls';
import { TelegraphLever } from '../TelegraphLever';
import { HelmControl } from '../HelmControl';
import RudderAngleIndicator from '../RudderAngleIndicator';
import { ChatPanel } from '../ChatPanel';
import EventLog from '../EventLog';
import { MarineRadio } from '../radio';
import { ConningDisplay, ConningDisplayData } from '../bridge/ConningDisplay';
import { AlarmIndicator } from '../alarms/AlarmIndicator';
import DepthSounder from '../DepthSounder';
import { EcdisDisplay } from '../navigation/EcdisDisplay';
import {
  AISTarget,
  ARPASettings,
  ARPATarget,
  EBL,
  GuardZone,
  RadarDisplay,
  RadarSettings,
  RadarTarget,
  VRM,
} from '../radar';
import styles from '../HudDrawer.module.css';
import {
  RUDDER_STALL_ANGLE_DEG,
  clampRudderAngle,
} from '../../constants/vessel';
import { SystemMeter } from '../SystemMeter';
import {
  ALARM_ICON_SIZE_PX,
  BALLAST_SLIDER_STEP,
  BEAM_DECIMALS,
  BLOCK_COEFF_DECIMALS,
  DAMAGE_CRITICAL_THRESHOLD,
  DEFAULT_BALLAST,
  DEFAULT_SPACE_ID,
  DEG_PER_RAD,
  DRAFT_DECIMALS,
  ECONOMY_TRANSACTIONS_LIMIT,
  FUEL_CONSUMPTION_DECIMALS,
  FLEET_COORD_DECIMALS,
  LAT_LON_DECIMALS,
  MASS_TON_DECIMALS,
  OIL_PRESSURE_DECIMALS,
  PERCENT_DECIMALS,
  PERCENT_SCALE,
  POWER_DECIMALS,
  REPLAY_SECONDS_DECIMALS,
  RPM_DECIMALS,
  RADIO_DISPLAY_HEIGHT_PX,
  RADIO_DISPLAY_WIDTH_PX,
  RADAR_DISPLAY_SIZE_PX,
  TEMPERATURE_DECIMALS,
  TRANSACTION_AMOUNT_DECIMALS,
  SAFETY_SCORE_DECIMALS,
  SEA_DEPTH_DECIMALS,
  STABILITY_DECIMALS,
  THROTTLE_MAX,
  THROTTLE_MIN,
  VOLTAGE_DECIMALS,
  ACCOUNT_DECIMALS,
  XP_DECIMALS,
  REPAIR_SPEED_THRESHOLD_MS,
  REPLAY_MIN_FRAMES,
  MS_PER_SECOND,
  RUDDER_INDICATOR_SIZE_PX,
  TELEGRAPH_SCALE,
} from './constants';
import { formatCoord, formatDistance, formatTransactionReason } from './format';
import { EconomyPort, EconomyTransaction, FleetVessel } from './types';
import { DamageState } from '../../lib/damage';
import {
  MissionAssignmentData,
  MissionDefinition,
} from '../../types/mission.types';
import { AccountState } from '../../store';
import { OwnShipData } from '../radar/arpa';
import { RadarEnvironment } from '../radar/types';
import { SimpleVesselState, VesselState } from '../../types/vessel.types';

type ReplayFrame = {
  timestamp: number;
};

type ReplayState = {
  recording: boolean;
  playing: boolean;
  frames: ReplayFrame[];
};

export function HudVesselsPanel({
  fleetLoading,
  fleetError,
  fleetInSpace,
  fleetOtherSpace,
  resolveNearestPort,
  shortId,
  normalizedSpaceId,
  otherVessels,
  onJoinVessel,
}: {
  fleetLoading: boolean;
  fleetError: string | null;
  fleetInSpace: FleetVessel[];
  fleetOtherSpace: FleetVessel[];
  resolveNearestPort: (
    lat: number,
    lon: number,
  ) => {
    port: EconomyPort | null;
    distance: number | null;
  };
  shortId: (id: string) => string;
  normalizedSpaceId: string;
  otherVessels: Record<string, SimpleVesselState>;
  onJoinVessel: (id: string) => void;
}) {
  return (
    <div className={styles.sectionGrid}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Fleet control</div>
          <div className={styles.sectionSub}>
            Join chartered and leased vessels directly from here.
          </div>
        </div>
        {fleetLoading ? (
          <div className={styles.noticeText}>Loading fleet...</div>
        ) : null}
      </div>
      {fleetError ? (
        <div className={styles.noticeText}>{fleetError}</div>
      ) : null}
      <div className={styles.fleetGrid}>
        {fleetInSpace.length === 0 ? (
          <div className={styles.noticeText}>
            No vessels in this space. Charter one from the economy page.
          </div>
        ) : (
          fleetInSpace.map(entry => {
            const { port, distance } = resolveNearestPort(entry.lat, entry.lon);
            const isStored = entry.status === 'stored';
            return (
              <div key={entry.id} className={styles.fleetRow}>
                <div>
                  <div className={styles.fleetTitle}>{shortId(entry.id)}</div>
                  <div className={styles.fleetMeta}>
                    Status {entry.status || 'active'}
                    {entry.spaceId
                      ? ` · Space ${entry.spaceId}`
                      : ` · Space ${normalizedSpaceId}`}
                    {port
                      ? ` · Nearest port ${port.name} (${formatDistance(
                          distance ?? 0,
                        )})`
                      : ''}
                  </div>
                  <div className={styles.fleetMeta}>
                    Lat {entry.lat.toFixed(FLEET_COORD_DECIMALS)} · Lon{' '}
                    {entry.lon.toFixed(FLEET_COORD_DECIMALS)}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.fleetButton}
                  disabled={isStored}
                  onClick={() => {
                    if (isStored) return;
                    onJoinVessel(entry.id);
                  }}
                >
                  {isStored ? 'Stored' : 'Join'}
                </button>
              </div>
            );
          })
        )}
      </div>
      {fleetOtherSpace.length > 0 ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Other spaces</div>
          <div className={styles.noticeText}>
            These vessels are in other spaces and cannot be joined from here.
          </div>
          <div className={styles.fleetGrid}>
            {fleetOtherSpace.map(entry => (
              <div key={entry.id} className={styles.fleetRow}>
                <div>
                  <div className={styles.fleetTitle}>{shortId(entry.id)}</div>
                  <div className={styles.fleetMeta}>
                    Space {entry.spaceId || DEFAULT_SPACE_ID} · Status{' '}
                    {entry.status || 'active'}
                  </div>
                </div>
                <button type="button" className={styles.fleetButton} disabled>
                  Not in space
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Other vessels</div>
          <div className={styles.sectionSub}>
            Vessels currently broadcasting in your space.
          </div>
        </div>
      </div>
      <div className={styles.fleetGrid}>
        {Object.values(otherVessels || {}).length === 0 ? (
          <div className={styles.noticeText}>No nearby vessels.</div>
        ) : (
          Object.values(otherVessels || {}).map(entry => (
            <div key={entry.id} className={styles.fleetRow}>
              <div>
                <div className={styles.fleetTitle}>
                  {entry.properties?.name || shortId(entry.id)}
                </div>
                <div className={styles.fleetMeta}>
                  {entry.crewCount ?? 0} crew · Heading{' '}
                  {Math.round(entry.orientation?.heading ?? 0)}°
                </div>
              </div>
              <button
                type="button"
                className={styles.fleetButton}
                onClick={() => onJoinVessel(entry.id)}
              >
                Request join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function HudNavigationPanel({
  navStats,
}: {
  navStats: Array<{ label: string; value: string; detail?: string }>;
}) {
  return (
    <div className={styles.sectionGrid}>
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
    </div>
  );
}

export function HudNavControls({
  throttleLocal,
  setThrottleLocal,
  rudderAngleLocal,
  setRudderAngleLocal,
  canAdjustThrottle,
  canAdjustRudder,
}: {
  throttleLocal: number;
  setThrottleLocal: (value: number) => void;
  rudderAngleLocal: number;
  setRudderAngleLocal: (value: number) => void;
  canAdjustThrottle: boolean;
  canAdjustRudder: boolean;
}) {
  return (
    <div className={styles.navControlsRow}>
      <TelegraphLever
        label="Throttle"
        value={throttleLocal}
        min={THROTTLE_MIN}
        max={THROTTLE_MAX}
        onChange={setThrottleLocal}
        disabled={!canAdjustThrottle}
        scale={TELEGRAPH_SCALE}
      />
      <HelmControl
        value={rudderAngleLocal * DEG_PER_RAD}
        minAngle={-RUDDER_STALL_ANGLE_DEG}
        maxAngle={RUDDER_STALL_ANGLE_DEG}
        onChange={deg =>
          setRudderAngleLocal(clampRudderAngle(deg / DEG_PER_RAD))
        }
        disabled={!canAdjustRudder}
      />
      <RudderAngleIndicator
        angle={rudderAngleLocal * DEG_PER_RAD}
        maxAngle={RUDDER_STALL_ANGLE_DEG}
        size={RUDDER_INDICATOR_SIZE_PX}
      />
    </div>
  );
}

export function HudCrewPanel({
  crewRoster,
  stationByUser,
  helmStation,
  engineStation,
  radioStation,
  sessionUserId,
  crewIds,
  isAdmin,
  onRequestStation,
}: {
  crewRoster: Array<{ id: string; name: string }>;
  stationByUser: Map<string, string[]>;
  helmStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  engineStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  radioStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  sessionUserId?: string | null;
  crewIds: string[];
  isAdmin: boolean;
  onRequestStation: (
    station: 'helm' | 'engine' | 'radio',
    action: 'claim' | 'release',
  ) => void;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className="flex items-center justify-between">
        <div className={styles.sectionTitle}>Crew & stations</div>
        <div className={styles.sectionSub}>{crewRoster.length || 0} aboard</div>
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
                    {(stationByUser.get(member.id) || []).map(station => (
                      <span
                        key={`${member.id}-${station}`}
                        className={styles.badge}
                      >
                        {station}
                      </span>
                    ))}
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
              const isSelf = sessionUserId && holderId === sessionUserId;
              const canClaim =
                (sessionUserId && crewIds.includes(sessionUserId)) || isAdmin;
              const isHeldByOther = Boolean(
                holderId && sessionUserId && holderId !== sessionUserId,
              );
              const action: 'claim' | 'release' = isSelf ? 'release' : 'claim';
              const disabled = !canClaim || (isHeldByOther && !isAdmin);
              return (
                <div key={item.key} className={styles.crewRow}>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {holderId ? `Held by ${holderName}` : 'Unassigned'}
                    </div>
                    <div className={styles.stationHint}>{item.description}</div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onRequestStation(
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
  );
}

export function HudEcdisPanel({
  shipPosition,
  heading,
}: {
  shipPosition: { lat: number; lon: number; z?: number };
  heading: number | undefined;
}) {
  return <EcdisDisplay shipPosition={shipPosition} heading={heading} />;
}

export function HudConningPanel({
  conningData,
}: {
  conningData: ConningDisplayData;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <ConningDisplay data={conningData} />
        </div>
      </div>
    </div>
  );
}

export function HudSounderPanel({ depthValue }: { depthValue?: number }) {
  return (
    <div className={styles.sectionCard}>
      {depthValue !== undefined ? (
        <DepthSounder depth={depthValue} />
      ) : (
        <div className={styles.noticeText}>
          Depth data unavailable for this position.
        </div>
      )}
    </div>
  );
}

export function HudWeatherPanel() {
  return <EnvironmentControls />;
}

export function HudSystemsPanel({
  engineRunning,
  fuelPercent,
  loadPercent,
  batteryPercent,
  ballastPercent,
  canAdjustThrottle,
  engineState,
  electrical,
  powerBalance,
  damageState,
  repairCost,
  speedMs,
  draftEstimate,
  stability,
  vesselProperties,
  waterDepth,
  underKeel,
  setBallastLocal,
  onRequestRepair,
}: {
  engineRunning: boolean;
  fuelPercent: number;
  loadPercent: number;
  batteryPercent: number;
  ballastPercent: number;
  canAdjustThrottle: boolean;
  engineState: VesselState['engineState'];
  electrical: VesselState['electricalSystem'];
  powerBalance: number;
  damageState: DamageState;
  repairCost: number;
  speedMs: number;
  draftEstimate: number;
  stability: VesselState['stability'];
  vesselProperties: VesselState['properties'];
  waterDepth?: number;
  underKeel?: number;
  setBallastLocal: (value: number) => void;
  onRequestRepair: () => void;
}) {
  return (
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
            value={`${(fuelPercent * PERCENT_SCALE).toFixed(PERCENT_DECIMALS)}%`}
            detail={`${engineState.fuelConsumption.toFixed(FUEL_CONSUMPTION_DECIMALS)} kg/h`}
            percent={fuelPercent}
          />
          <SystemMeter
            label="Engine load"
            value={`${(loadPercent * PERCENT_SCALE).toFixed(PERCENT_DECIMALS)}%`}
            detail={`${engineState.rpm.toFixed(RPM_DECIMALS)} rpm`}
            percent={loadPercent}
          />
          <SystemMeter
            label="Temperature"
            value={`${engineState.temperature.toFixed(TEMPERATURE_DECIMALS)}°C`}
            detail={`Oil ${engineState.oilPressure.toFixed(OIL_PRESSURE_DECIMALS)} bar`}
          />
          <div className={styles.systemCard}>
            <div className={styles.systemLabel}>Ballast</div>
            <input
              type="range"
              min={0}
              max={1}
              step={BALLAST_SLIDER_STEP}
              value={ballastPercent}
              disabled={!canAdjustThrottle}
              onChange={e => {
                const next = parseFloat(e.target.value);
                setBallastLocal(Number.isNaN(next) ? DEFAULT_BALLAST : next);
              }}
              className={styles.systemRange}
            />
            <div className={styles.systemMeta}>
              {(ballastPercent * PERCENT_SCALE).toFixed(PERCENT_DECIMALS)}%
              ballast
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
            {electrical?.generatorRunning
              ? 'Generator online'
              : 'Generator offline'}
          </span>
        </div>
        <div className={styles.systemGrid}>
          <SystemMeter
            label="Battery"
            value={`${(batteryPercent * PERCENT_SCALE).toFixed(PERCENT_DECIMALS)}%`}
            detail={`${electrical.mainBusVoltage.toFixed(VOLTAGE_DECIMALS)} V bus`}
            percent={batteryPercent}
          />
          <SystemMeter
            label="Generation"
            value={`${electrical.generatorOutput.toFixed(POWER_DECIMALS)} kW`}
            detail={`Load ${electrical.powerConsumption.toFixed(POWER_DECIMALS)} kW`}
          />
          <SystemMeter
            label="Balance"
            value={`${powerBalance.toFixed(POWER_DECIMALS)} kW`}
            detail={powerBalance >= 0 ? 'Surplus power' : 'Power deficit'}
          />
        </div>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Damage & repairs</div>
          <span className={styles.badge}>
            {damageState.hullIntegrity < DAMAGE_CRITICAL_THRESHOLD
              ? 'Critical'
              : repairCost > 0
                ? 'Maintenance'
                : 'Healthy'}
          </span>
        </div>
        <div className={styles.systemGrid}>
          <SystemMeter
            label="Hull"
            value={`${Math.round(damageState.hullIntegrity * PERCENT_SCALE)}%`}
            percent={damageState.hullIntegrity}
          />
          <SystemMeter
            label="Engine"
            value={`${Math.round(damageState.engineHealth * PERCENT_SCALE)}%`}
            percent={damageState.engineHealth}
          />
          <SystemMeter
            label="Steering"
            value={`${Math.round(damageState.steeringHealth * PERCENT_SCALE)}%`}
            percent={damageState.steeringHealth}
          />
          <SystemMeter
            label="Electrical"
            value={`${Math.round(damageState.electricalHealth * PERCENT_SCALE)}%`}
            percent={damageState.electricalHealth}
          />
          <SystemMeter
            label="Flooding"
            value={`${Math.round(damageState.floodingDamage * PERCENT_SCALE)}%`}
            percent={1 - damageState.floodingDamage}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className={styles.sectionSub}>
            {repairCost > 0
              ? `Estimated repair cost: ${repairCost} cr`
              : 'No repairs needed'}
          </div>
          <button
            type="button"
            className={`${styles.stationButton} ${
              repairCost <= 0 || speedMs > REPAIR_SPEED_THRESHOLD_MS
                ? styles.stationButtonDisabled
                : ''
            }`}
            disabled={repairCost <= 0 || speedMs > REPAIR_SPEED_THRESHOLD_MS}
            onClick={onRequestRepair}
          >
            Request repair
          </button>
        </div>
        {speedMs > REPAIR_SPEED_THRESHOLD_MS ? (
          <div className={styles.sectionSub}>
            Stop the vessel to begin repairs.
          </div>
        ) : null}
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Stability & load</div>
          <span className={styles.badge}>
            Draft (est) {draftEstimate.toFixed(DRAFT_DECIMALS)} m
          </span>
        </div>
        <div className={styles.statGrid}>
          {[
            {
              label: 'GM',
              value: `${stability.metacentricHeight.toFixed(STABILITY_DECIMALS)} m`,
            },
            {
              label: 'Trim',
              value: `${stability.trim.toFixed(STABILITY_DECIMALS)}°`,
            },
            {
              label: 'List',
              value: `${stability.list.toFixed(STABILITY_DECIMALS)}°`,
            },
            {
              label: 'Displacement',
              value: `${(vesselProperties.mass / 1000).toFixed(MASS_TON_DECIMALS)} t`,
            },
            {
              label: 'Block coeff',
              value:
                vesselProperties.blockCoefficient.toFixed(BLOCK_COEFF_DECIMALS),
            },
            {
              label: 'Depth',
              value:
                waterDepth !== undefined
                  ? `${waterDepth.toFixed(SEA_DEPTH_DECIMALS)} m`
                  : '—',
            },
            {
              label: 'Under keel',
              value:
                underKeel !== undefined
                  ? `${underKeel.toFixed(SEA_DEPTH_DECIMALS)} m`
                  : '—',
            },
            {
              label: 'Beam',
              value: `${vesselProperties.beam.toFixed(BEAM_DECIMALS)} m`,
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
  );
}

export function HudMissionsPanel({
  account,
  socketLatencyMs,
  rankProgress,
  xpToNext,
  economyLoading,
  economyError,
  economyTransactions,
  activeAssignments,
  missions,
  assignmentsByMission,
  canAcceptMissions,
  missionError,
  missionBusyId,
  onAssignMission,
}: {
  account: AccountState;
  socketLatencyMs: number | null;
  rankProgress: number;
  xpToNext: number;
  economyLoading: boolean;
  economyError: string | null;
  economyTransactions: EconomyTransaction[];
  activeAssignments: MissionAssignmentData[];
  missions: MissionDefinition[];
  assignmentsByMission: Map<string, MissionAssignmentData>;
  canAcceptMissions: boolean;
  missionError: string | null;
  missionBusyId: string | null;
  onAssignMission: (missionId: string) => void;
}) {
  return (
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
              {account.credits.toFixed(ACCOUNT_DECIMALS)}
            </div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Experience</div>
            <div className={styles.accountValue}>
              {account.experience.toFixed(ACCOUNT_DECIMALS)}
            </div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Safety</div>
            <div className={styles.accountValue}>
              {account.safetyScore.toFixed(SAFETY_SCORE_DECIMALS)}
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
              style={{
                width: `${(rankProgress * PERCENT_SCALE).toFixed(
                  PERCENT_DECIMALS,
                )}%`,
              }}
            />
          </div>
          <div className={styles.progressMeta}>
            Next rank in {xpToNext.toFixed(XP_DECIMALS)} XP
          </div>
        </div>
        <div className={styles.sectionSub}>
          Missions award credits and XP. Operating costs and port fees deduct
          credits while you sail; safety penalties apply for collisions or speed
          violations in regulated spaces.
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
            {economyTransactions
              .slice(0, ECONOMY_TRANSACTIONS_LIMIT)
              .map(tx => (
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
                    {tx.amount.toFixed(TRANSACTION_AMOUNT_DECIMALS)} cr
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
                <div key={assignment.id} className={styles.assignmentCard}>
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
                      <div className={styles.missionTitle}>{mission.name}</div>
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
                      onClick={() => onAssignMission(mission.id)}
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
  );
}

export function HudReplayPanel({
  replay,
  replayDuration,
  startReplayRecording,
  stopReplayRecording,
  startReplayPlayback,
  stopReplayPlayback,
  clearReplay,
}: {
  replay: ReplayState;
  replayDuration: number;
  startReplayRecording: () => void;
  stopReplayRecording: () => void;
  startReplayPlayback: () => void;
  stopReplayPlayback: () => void;
  clearReplay: () => void;
}) {
  return (
    <div className={styles.sectionGrid}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Replay console</div>
        <div className={styles.replayMeta}>
          {replay.frames.length} frames •{' '}
          {(replayDuration / MS_PER_SECOND).toFixed(REPLAY_SECONDS_DECIMALS)}s
          recorded
        </div>
        <div className={styles.replayControls}>
          <button
            type="button"
            className={styles.replayButton}
            onClick={
              replay.recording ? stopReplayRecording : startReplayRecording
            }
            disabled={replay.playing}
          >
            {replay.recording ? 'Stop recording' : 'Start recording'}
          </button>
          <button
            type="button"
            className={styles.replayButtonSecondary}
            onClick={replay.playing ? stopReplayPlayback : startReplayPlayback}
            disabled={
              replay.frames.length < REPLAY_MIN_FRAMES || replay.recording
            }
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
          Record a run, stop, then play ghost to overlay the last capture.
          Playback freezes live control updates while active.
        </div>
      </div>
    </div>
  );
}

export function HudChatPanel({
  spaceId,
  currentVesselId,
}: {
  spaceId?: string | null;
  currentVesselId?: string | null;
}) {
  return (
    <div className={styles.sectionCard}>
      <ChatPanel
        spaceId={spaceId || null}
        vesselChannel={
          currentVesselId
            ? `vessel:${currentVesselId.split('_')[0] || ''}`
            : null
        }
      />
    </div>
  );
}

export function HudEventsPanel() {
  return (
    <div className={styles.sectionCard}>
      <EventLog />
    </div>
  );
}

export function HudRadioPanel() {
  return (
    <div className={styles.sectionCard}>
      <div className="flex justify-center">
        <div className="scale-90 md:scale-95 origin-top">
          <MarineRadio
            width={RADIO_DISPLAY_WIDTH_PX}
            height={RADIO_DISPLAY_HEIGHT_PX}
          />
        </div>
      </div>
    </div>
  );
}

export function HudRadarPanel({
  radarSettings,
  setRadarSettings,
  radarEbl,
  setRadarEbl,
  radarVrm,
  setRadarVrm,
  radarGuardZone,
  setRadarGuardZone,
  radarArpaSettings,
  setRadarArpaSettings,
  radarArpaEnabled,
  setRadarArpaEnabled,
  radarArpaTargets,
  setRadarArpaTargets,
  radarTargets,
  aisTargets,
  radarEnvironment,
  ownShipData,
}: {
  radarSettings: RadarSettings;
  setRadarSettings: (settings: RadarSettings) => void;
  radarEbl: EBL;
  setRadarEbl: (value: EBL) => void;
  radarVrm: VRM;
  setRadarVrm: (value: VRM) => void;
  radarGuardZone: GuardZone;
  setRadarGuardZone: (value: GuardZone) => void;
  radarArpaSettings: ARPASettings;
  setRadarArpaSettings: (value: ARPASettings) => void;
  radarArpaEnabled: boolean;
  setRadarArpaEnabled: (value: boolean) => void;
  radarArpaTargets: ARPATarget[];
  setRadarArpaTargets: (value: ARPATarget[]) => void;
  radarTargets: RadarTarget[];
  aisTargets: AISTarget[];
  radarEnvironment: RadarEnvironment;
  ownShipData: OwnShipData;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.radarGrid}>
        <div className="space-y-2">
          <div className={styles.radarTitle}>Radar</div>
          <RadarDisplay
            size={RADAR_DISPLAY_SIZE_PX}
            className="max-w-[920px] mx-auto"
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
    </div>
  );
}

export function HudAlarmsPanel({
  alarmItems,
}: {
  alarmItems: Array<{
    key: string;
    label: string;
    severity: 'warning' | 'critical';
    active: boolean;
  }>;
}) {
  return (
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
              size={ALARM_ICON_SIZE_PX}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HudAdminPanel({
  adminTargets,
  adminTargetId,
  setAdminTargetId,
  adminLat,
  setAdminLat,
  adminLon,
  setAdminLon,
  selectedAdminTarget,
  onMove,
  onMoveToSelf,
}: {
  adminTargets: Array<{
    id: string;
    label: string;
    position: { x?: number; y?: number; lat?: number; lon?: number };
  }>;
  adminTargetId: string;
  setAdminTargetId: (value: string) => void;
  adminLat: string;
  setAdminLat: (value: string) => void;
  adminLon: string;
  setAdminLon: (value: string) => void;
  selectedAdminTarget?:
    | { position: { lat?: number; lon?: number } }
    | undefined;
  onMove: () => void;
  onMoveToSelf: () => void;
}) {
  return (
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
                LAT_LON_DECIMALS,
              )}
            />
            <div className={styles.adminHint}>
              Current:{' '}
              {formatCoord(selectedAdminTarget?.position.lat, LAT_LON_DECIMALS)}
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
                LAT_LON_DECIMALS,
              )}
            />
            <div className={styles.adminHint}>
              Current:{' '}
              {formatCoord(selectedAdminTarget?.position.lon, LAT_LON_DECIMALS)}
            </div>
          </label>
        </div>

        <div className={styles.adminActions}>
          <button type="button" className={styles.adminButton} onClick={onMove}>
            Move vessel
          </button>
          <button
            type="button"
            className={styles.adminButtonSecondary}
            onClick={onMoveToSelf}
          >
            Move to my position
          </button>
        </div>

        <div className={styles.sectionSub}>
          Drag-and-drop moves for spectator mode are planned; this panel is the
          temporary admin move tool.
        </div>
      </div>
    </div>
  );
}
