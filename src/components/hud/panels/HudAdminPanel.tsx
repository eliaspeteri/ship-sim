import React from 'react';
import { hudStyles as styles } from '../hudStyles';
import { LAT_LON_DECIMALS } from '../constants';
import { formatCoord } from '../format';

export function HudAdminPanel({
  adminTargets,
  adminTargetId,
  setAdminTargetId,
  adminLat,
  setAdminLat,
  adminLon,
  setAdminLon,
  selectedAdminTarget,
  onMove,
  onMoveToSelf,
}: {
  adminTargets: Array<{
    id: string;
    label: string;
    position: { x?: number; y?: number; lat?: number; lon?: number };
  }>;
  adminTargetId: string;
  setAdminTargetId: (value: string) => void;
  adminLat: string;
  setAdminLat: (value: string) => void;
  adminLon: string;
  setAdminLon: (value: string) => void;
  selectedAdminTarget?:
    | { position: { lat?: number; lon?: number } }
    | undefined;
  onMove: () => void;
  onMoveToSelf: () => void;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.adminPanel}>
        <div>
          <div className={styles.sectionTitle}>Vessel Selection</div>
          <select
            className={styles.adminSelect}
            value={adminTargetId}
            onChange={e => setAdminTargetId(e.target.value)}
          >
            {adminTargets.map(target => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.adminGrid}>
          <label className={styles.adminLabel}>
            Latitude
            <input
              className={styles.adminInput}
              value={adminLat}
              onChange={e => setAdminLat(e.target.value)}
              placeholder={formatCoord(
                selectedAdminTarget?.position.lat,
                LAT_LON_DECIMALS,
              )}
            />
            <div className={styles.adminHint}>
              Current:{' '}
              {formatCoord(selectedAdminTarget?.position.lat, LAT_LON_DECIMALS)}
            </div>
          </label>
          <label className={styles.adminLabel}>
            Longitude
            <input
              className={styles.adminInput}
              value={adminLon}
              onChange={e => setAdminLon(e.target.value)}
              placeholder={formatCoord(
                selectedAdminTarget?.position.lon,
                LAT_LON_DECIMALS,
              )}
            />
            <div className={styles.adminHint}>
              Current:{' '}
              {formatCoord(selectedAdminTarget?.position.lon, LAT_LON_DECIMALS)}
            </div>
          </label>
        </div>

        <div className={styles.adminActions}>
          <button type="button" className={styles.adminButton} onClick={onMove}>
            Move vessel
          </button>
          <button
            type="button"
            className={styles.adminButtonSecondary}
            onClick={onMoveToSelf}
          >
            Move to my position
          </button>
        </div>

        <div className={styles.sectionSub}>
          Drag-and-drop moves for spectator mode are planned; this panel is the
          temporary admin move tool.
        </div>
      </div>
    </div>
  );
}
