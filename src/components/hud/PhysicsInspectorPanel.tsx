import React from 'react';

import { hudStyles as styles } from './hudStyles';
import { buildDisplacementParams } from '../../lib/physicsParams';

import type { VesselState } from '../../types/vessel.types';

const DEFAULT_PRECISION = 3;

type PhysicsParamField = {
  key: string;
  label: string;
  unit?: string;
  precision?: number;
  step?: number | 'any';
};

type PhysicsParamSection = {
  title: string;
  fields: PhysicsParamField[];
};

const PHYSICS_PARAM_SECTIONS: PhysicsParamSection[] = [
  {
    title: 'Geometry',
    fields: [
      { key: 'mass', label: 'Mass', unit: 'kg', precision: 0 },
      { key: 'length', label: 'Length', unit: 'm', precision: 2 },
      { key: 'beam', label: 'Beam', unit: 'm', precision: 2 },
      { key: 'draft', label: 'Draft', unit: 'm', precision: 2 },
      { key: 'blockCoefficient', label: 'Block coeff', precision: 2 },
      { key: 'maxSpeed', label: 'Max speed', unit: 'm/s', precision: 2 },
    ],
  },
  {
    title: 'Propulsion & Rudder',
    fields: [
      { key: 'maxThrust', label: 'Max thrust', unit: 'N', precision: 0 },
      { key: 'rudderForceCoefficient', label: 'Rudder force coeff' },
      { key: 'rudderStallAngle', label: 'Rudder stall', unit: 'rad' },
      { key: 'rudderMaxAngle', label: 'Rudder max', unit: 'rad' },
      { key: 'rudderArea', label: 'Rudder area', unit: 'm^2', precision: 2 },
      { key: 'rudderArm', label: 'Rudder arm', unit: 'm', precision: 2 },
      { key: 'rudderLiftSlope', label: 'Rudder lift slope' },
      { key: 'propWashFactor', label: 'Prop wash factor' },
      { key: 'engineTimeConstant', label: 'Engine time constant', unit: 's' },
      { key: 'rudderRateLimit', label: 'Rudder rate', unit: 'rad/s' },
    ],
  },
  {
    title: 'Drag & Damping',
    fields: [
      { key: 'dragCoefficient', label: 'Base drag coeff' },
      { key: 'cdSurge', label: 'Cd surge' },
      { key: 'cdSway', label: 'Cd sway' },
      { key: 'cdYaw', label: 'Cd yaw' },
      { key: 'yawDamping', label: 'Yaw damping' },
      { key: 'yawDampingQuad', label: 'Yaw damping quad' },
      { key: 'swayDamping', label: 'Sway damping' },
      { key: 'rollDamping', label: 'Roll damping' },
      { key: 'pitchDamping', label: 'Pitch damping' },
      { key: 'heaveStiffness', label: 'Heave stiffness' },
      { key: 'heaveDamping', label: 'Heave damping' },
    ],
  },
  {
    title: 'Added Mass & Hull Derivatives',
    fields: [
      { key: 'addedMassX', label: 'Added mass X', unit: 'kg', precision: 0 },
      { key: 'addedMassY', label: 'Added mass Y', unit: 'kg', precision: 0 },
      {
        key: 'addedMassYaw',
        label: 'Added mass yaw',
        unit: 'kg*m^2',
        precision: 0,
      },
      { key: 'hullYv', label: 'Hull Yv' },
      { key: 'hullYr', label: 'Hull Yr' },
      { key: 'hullNv', label: 'Hull Nv' },
      { key: 'hullNr', label: 'Hull Nr' },
    ],
  },
  {
    title: 'Shallow Water Modifiers',
    fields: [
      { key: 'shallowWaterFactor', label: 'Drag factor' },
      { key: 'shallowWaterYawFactor', label: 'Yaw factor' },
      { key: 'shallowWaterRudderFactor', label: 'Rudder factor' },
    ],
  },
];

const PHYSICS_PARAM_FIELDS = PHYSICS_PARAM_SECTIONS.flatMap(
  section => section.fields,
);

const formatValue = (value: number, precision?: number) => {
  if (!Number.isFinite(value)) return '-';
  const decimals = precision ?? DEFAULT_PRECISION;
  return value.toFixed(decimals);
};

const parseOverrideValue = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildOverrideValues = (params?: Record<string, number>) => {
  const overrides: Record<string, string> = {};
  for (const field of PHYSICS_PARAM_FIELDS) {
    const value = params?.[field.key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      overrides[field.key] = `${value}`;
    }
  }
  return overrides;
};

export function HudPhysicsInspectorPanel({
  vessel,
  onApplyParams,
}: {
  vessel: VesselState;
  onApplyParams: (params: Record<string, number>) => void;
}) {
  const model = vessel.physics?.model ?? 'displacement';
  const schemaVersion = vessel.physics?.schemaVersion ?? 1;
  const effectiveParams = React.useMemo(
    () => buildDisplacementParams(vessel),
    [vessel],
  );
  const [localOverrides, setLocalOverrides] = React.useState<
    Record<string, string>
  >(() => buildOverrideValues(vessel.physics?.params));

  React.useEffect(() => {
    setLocalOverrides(buildOverrideValues(vessel.physics?.params));
  }, [vessel.physics?.params]);

  const handleApply = () => {
    const nextParams: Record<string, number> = {};
    for (const field of PHYSICS_PARAM_FIELDS) {
      const raw = localOverrides[field.key] ?? '';
      const parsed = parseOverrideValue(raw);
      if (parsed === null) continue;
      nextParams[field.key] = parsed;
    }
    onApplyParams(nextParams);
  };

  const handleClear = () => {
    setLocalOverrides({});
    onApplyParams({});
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.physicsPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>Physics Params</div>
            <div className={styles.sectionSub}>
              Model: {model} | Schema: {schemaVersion}
            </div>
          </div>
          <div className={styles.adminActions}>
            <button
              type="button"
              className={styles.adminButton}
              onClick={handleApply}
            >
              Apply overrides
            </button>
            <button
              type="button"
              className={styles.adminButtonSecondary}
              onClick={handleClear}
            >
              Clear overrides
            </button>
          </div>
        </div>

        {PHYSICS_PARAM_SECTIONS.map(section => (
          <div key={section.title} className={styles.physicsSection}>
            <div className={styles.sectionTitle}>{section.title}</div>
            <div className={styles.physicsGrid}>
              <div className={styles.physicsHeader}>Param</div>
              <div className={styles.physicsHeader}>Current</div>
              <div className={styles.physicsHeader}>Override</div>
              {section.fields.map(field => (
                <React.Fragment key={field.key}>
                  <div className={styles.physicsLabel}>
                    <div>{field.label}</div>
                    {field.unit ? (
                      <span className={styles.physicsUnit}>{field.unit}</span>
                    ) : null}
                  </div>
                  <div className={styles.physicsValue}>
                    {formatValue(
                      (effectiveParams as Record<string, number>)[field.key],
                      field.precision,
                    )}
                  </div>
                  <input
                    className={styles.physicsInput}
                    type="number"
                    inputMode="decimal"
                    step={field.step ?? 'any'}
                    value={localOverrides[field.key] ?? ''}
                    onChange={event =>
                      setLocalOverrides(prev => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={formatValue(
                      (effectiveParams as Record<string, number>)[field.key],
                      field.precision,
                    )}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
