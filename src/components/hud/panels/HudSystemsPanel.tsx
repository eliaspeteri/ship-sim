import React from 'react';
import { SystemMeter } from '../../SystemMeter';
import { hudStyles as styles } from '../hudStyles';
import {
  BALLAST_SLIDER_STEP,
  BEAM_DECIMALS,
  BLOCK_COEFF_DECIMALS,
  DAMAGE_CRITICAL_THRESHOLD,
  DEFAULT_BALLAST,
  DRAFT_DECIMALS,
  FUEL_CONSUMPTION_DECIMALS,
  MASS_TON_DECIMALS,
  OIL_PRESSURE_DECIMALS,
  PERCENT_DECIMALS,
  PERCENT_SCALE,
  POWER_DECIMALS,
  REPAIR_SPEED_THRESHOLD_MS,
  RPM_DECIMALS,
  SEA_DEPTH_DECIMALS,
  STABILITY_DECIMALS,
  TEMPERATURE_DECIMALS,
  VOLTAGE_DECIMALS,
} from '../constants';
import type { DamageState } from '../../../lib/damage';
import type { VesselState } from '../../../types/vessel.types';

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
