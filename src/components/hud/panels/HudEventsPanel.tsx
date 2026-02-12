import React from 'react';
import EventLog from '../../EventLog';
import styles from '../../HudDrawer.module.css';

export function HudEventsPanel() {
  return (
    <div className={styles.sectionCard}>
      <EventLog />
    </div>
  );
}
