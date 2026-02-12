import React from 'react';
import {
  ConningDisplay,
  ConningDisplayData,
} from '../../bridge/ConningDisplay';
import styles from '../../HudDrawer.module.css';

export function HudConningPanel({
  conningData,
}: {
  conningData: ConningDisplayData;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <ConningDisplay data={conningData} />
        </div>
      </div>
    </div>
  );
}
