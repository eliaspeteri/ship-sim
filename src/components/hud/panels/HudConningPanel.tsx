import React from 'react';
import type { ConningDisplayData } from '../../bridge/ConningDisplay';
import { ConningDisplay } from '../../bridge/ConningDisplay';
import { hudStyles as styles } from '../hudStyles';

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
