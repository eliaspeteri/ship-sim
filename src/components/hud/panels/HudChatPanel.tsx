import React from 'react';
import { ChatPanel } from '../../ChatPanel';
import { hudStyles as styles } from '../hudStyles';

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
