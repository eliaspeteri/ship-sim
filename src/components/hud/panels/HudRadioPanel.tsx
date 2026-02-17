import React from 'react';

import { MarineRadio } from '../../radio';
import { RADIO_DISPLAY_HEIGHT_PX, RADIO_DISPLAY_WIDTH_PX } from '../constants';
import { hudStyles as styles } from '../hudStyles';

export function HudRadioPanel() {
  return (
    <div className={styles.sectionCard}>
      <div className="flex justify-center">
        <div className="scale-90 md:scale-95 origin-top">
          <MarineRadio
            width={RADIO_DISPLAY_WIDTH_PX}
            height={RADIO_DISPLAY_HEIGHT_PX}
          />
        </div>
      </div>
    </div>
  );
}
