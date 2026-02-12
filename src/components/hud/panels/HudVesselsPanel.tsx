import React from 'react';
import styles from '../../HudDrawer.module.css';
import { DEFAULT_SPACE_ID, FLEET_COORD_DECIMALS } from '../constants';
import { formatDistance } from '../format';
import { EconomyPort, FleetVessel } from '../types';
import { SimpleVesselState } from '../../../types/vessel.types';

export function HudVesselsPanel({
  fleetLoading,
  fleetError,
  fleetInSpace,
  fleetOtherSpace,
  resolveNearestPort,
  shortId,
  normalizedSpaceId,
  otherVessels,
  onJoinVessel,
}: {
  fleetLoading: boolean;
  fleetError: string | null;
  fleetInSpace: FleetVessel[];
  fleetOtherSpace: FleetVessel[];
  resolveNearestPort: (
    lat: number,
    lon: number,
  ) => {
    port: EconomyPort | null;
    distance: number | null;
  };
  shortId: (id: string) => string;
  normalizedSpaceId: string;
  otherVessels: Record<string, SimpleVesselState>;
  onJoinVessel: (id: string) => void;
}) {
  return (
    <div className={styles.sectionGrid}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Fleet control</div>
          <div className={styles.sectionSub}>
            Join chartered and leased vessels directly from here.
          </div>
        </div>
        {fleetLoading ? (
          <div className={styles.noticeText}>Loading fleet...</div>
        ) : null}
      </div>
      {fleetError ? (
        <div className={styles.noticeText}>{fleetError}</div>
      ) : null}
      <div className={styles.fleetGrid}>
        {fleetInSpace.length === 0 ? (
          <div className={styles.noticeText}>
            No vessels in this space. Charter one from the economy page.
          </div>
        ) : (
          fleetInSpace.map(entry => {
            const { port, distance } = resolveNearestPort(entry.lat, entry.lon);
            const isStored = entry.status === 'stored';
            return (
              <div key={entry.id} className={styles.fleetRow}>
                <div>
                  <div className={styles.fleetTitle}>{shortId(entry.id)}</div>
                  <div className={styles.fleetMeta}>
                    Status {entry.status || 'active'}
                    {entry.spaceId
                      ? ` · Space ${entry.spaceId}`
                      : ` · Space ${normalizedSpaceId}`}
                    {port
                      ? ` · Nearest port ${port.name} (${formatDistance(
                          distance ?? 0,
                        )})`
                      : ''}
                  </div>
                  <div className={styles.fleetMeta}>
                    Lat {entry.lat.toFixed(FLEET_COORD_DECIMALS)} · Lon{' '}
                    {entry.lon.toFixed(FLEET_COORD_DECIMALS)}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.fleetButton}
                  disabled={isStored}
                  onClick={() => {
                    if (isStored) return;
                    onJoinVessel(entry.id);
                  }}
                >
                  {isStored ? 'Stored' : 'Join'}
                </button>
              </div>
            );
          })
        )}
      </div>
      {fleetOtherSpace.length > 0 ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Other spaces</div>
          <div className={styles.noticeText}>
            These vessels are in other spaces and cannot be joined from here.
          </div>
          <div className={styles.fleetGrid}>
            {fleetOtherSpace.map(entry => (
              <div key={entry.id} className={styles.fleetRow}>
                <div>
                  <div className={styles.fleetTitle}>{shortId(entry.id)}</div>
                  <div className={styles.fleetMeta}>
                    Space {entry.spaceId || DEFAULT_SPACE_ID} · Status{' '}
                    {entry.status || 'active'}
                  </div>
                </div>
                <button type="button" className={styles.fleetButton} disabled>
                  Not in space
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Other vessels</div>
          <div className={styles.sectionSub}>
            Vessels currently broadcasting in your space.
          </div>
        </div>
      </div>
      <div className={styles.fleetGrid}>
        {Object.values(otherVessels || {}).length === 0 ? (
          <div className={styles.noticeText}>No nearby vessels.</div>
        ) : (
          Object.values(otherVessels || {}).map(entry => (
            <div key={entry.id} className={styles.fleetRow}>
              <div>
                <div className={styles.fleetTitle}>
                  {entry.properties?.name || shortId(entry.id)}
                </div>
                <div className={styles.fleetMeta}>
                  {entry.crewCount ?? 0} crew · Heading{' '}
                  {Math.round(entry.orientation?.heading ?? 0)}°
                </div>
              </div>
              <button
                type="button"
                className={styles.fleetButton}
                onClick={() => onJoinVessel(entry.id)}
              >
                Request join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
