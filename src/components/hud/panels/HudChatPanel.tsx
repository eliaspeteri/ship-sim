import React from 'react';
import { ChatPanel } from '../../ChatPanel';
import styles from '../../HudDrawer.module.css';

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
        spaceId={spaceId ?? 'global'}
        vesselChannel={
          currentVesselId
            ? `vessel:${currentVesselId.split('_')[0] || ''}`
            : null
        }
      />
    </div>
  );
}
