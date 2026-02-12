import React from 'react';
import EventLog from '../../EventLog';
import { hudStyles as styles } from '../hudStyles';

export function HudEventsPanel() {
  return (
    <div className={styles.sectionCard}>
      <EventLog />
    </div>
  );
}
