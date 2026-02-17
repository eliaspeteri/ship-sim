import { METER_DANGER_THRESHOLD, METER_WARN_THRESHOLD } from './hud/constants';
import { clamp01 } from './hud/format';
import { hudStyles as styles } from './hud/hudStyles';

export const SystemMeter = ({
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
      ? clamped <= METER_DANGER_THRESHOLD
        ? styles.meterFillDanger
        : clamped <= METER_WARN_THRESHOLD
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
