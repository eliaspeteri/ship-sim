import styles from './HudDrawer.module.css';

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
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
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
