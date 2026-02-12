import React from 'react';
import styles from '../../HudDrawer.module.css';

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
