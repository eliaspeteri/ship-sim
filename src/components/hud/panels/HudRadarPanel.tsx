import React from 'react';
import type {
  AISTarget,
  ARPASettings,
  ARPATarget,
  EBL,
  GuardZone,
  RadarSettings,
  RadarTarget,
  VRM,
} from '../../radar';
import { RadarDisplay } from '../../radar';
import { hudStyles as styles } from '../hudStyles';
import { RADAR_DISPLAY_SIZE_PX } from '../constants';
import type { OwnShipData } from '../../radar/arpa';
import type { RadarEnvironment } from '../../radar/types';

export function HudRadarPanel({
  radarSettings,
  setRadarSettings,
  radarEbl,
  setRadarEbl,
  radarVrm,
  setRadarVrm,
  radarGuardZone,
  setRadarGuardZone,
  radarArpaSettings,
  setRadarArpaSettings,
  radarArpaEnabled,
  setRadarArpaEnabled,
  radarArpaTargets,
  setRadarArpaTargets,
  radarTargets,
  aisTargets,
  radarEnvironment,
  ownShipData,
}: {
  radarSettings: RadarSettings;
  setRadarSettings: (settings: RadarSettings) => void;
  radarEbl: EBL;
  setRadarEbl: (value: EBL) => void;
  radarVrm: VRM;
  setRadarVrm: (value: VRM) => void;
  radarGuardZone: GuardZone;
  setRadarGuardZone: (value: GuardZone) => void;
  radarArpaSettings: ARPASettings;
  setRadarArpaSettings: (value: ARPASettings) => void;
  radarArpaEnabled: boolean;
  setRadarArpaEnabled: (value: boolean) => void;
  radarArpaTargets: ARPATarget[];
  setRadarArpaTargets: (value: ARPATarget[]) => void;
  radarTargets: RadarTarget[];
  aisTargets: AISTarget[];
  radarEnvironment: RadarEnvironment;
  ownShipData: OwnShipData;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.radarGrid}>
        <div className="space-y-2">
          <div className={styles.radarTitle}>Radar</div>
          <RadarDisplay
            size={RADAR_DISPLAY_SIZE_PX}
            className="w-full"
            layout="side"
            initialSettings={radarSettings}
            onSettingsChange={setRadarSettings}
            ebl={radarEbl}
            onEblChange={setRadarEbl}
            vrm={radarVrm}
            onVrmChange={setRadarVrm}
            guardZone={radarGuardZone}
            onGuardZoneChange={setRadarGuardZone}
            arpaSettings={radarArpaSettings}
            onArpaSettingsChange={setRadarArpaSettings}
            arpaEnabled={radarArpaEnabled}
            onArpaEnabledChange={setRadarArpaEnabled}
            arpaTargets={radarArpaTargets}
            onArpaTargetsChange={setRadarArpaTargets}
            liveTargets={radarTargets}
            aisTargets={aisTargets}
            environment={radarEnvironment}
            ownShipData={ownShipData}
          />
        </div>
      </div>
    </div>
  );
}
