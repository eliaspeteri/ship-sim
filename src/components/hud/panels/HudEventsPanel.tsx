import React from 'react';
import HudEventLog from '../../EventLog';
import { hudStyles as styles } from '../hudStyles';

export function HudEventsPanel() {
  return (
    <div className={styles.sectionCard}>
      <HudEventLog />
    </div>
  );
}
