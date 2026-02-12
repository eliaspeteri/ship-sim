import React from 'react';
import DepthSounder from '../../DepthSounder';
import styles from '../../HudDrawer.module.css';

export function HudSounderPanel({ depthValue }: { depthValue?: number }) {
  return (
    <div className={styles.sectionCard}>
      {depthValue !== undefined ? (
        <DepthSounder depth={depthValue} />
      ) : (
        <div className={styles.noticeText}>
          Depth data unavailable for this position.
        </div>
      )}
    </div>
  );
}
