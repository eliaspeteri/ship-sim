import React from 'react';
import { AlarmIndicator } from '../../alarms/AlarmIndicator';
import { hudStyles as styles } from '../hudStyles';
import { ALARM_ICON_SIZE_PX } from '../constants';

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
