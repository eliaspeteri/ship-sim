import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../../lib/api';
import {
  courseFromWorldVelocity,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../../lib/position';
import styles from './VesselDetails.module.css';

type VesselDetails = {
  id: string;
  spaceId: string;
  ownerId?: string | null;
  mode?: string | null;
  desiredMode?: string | null;
  lastCrewAt?: number | null;
  lastUpdate?: number | null;
  isAi?: boolean | null;
  position: { lat: number; lon: number; z: number };
  orientation: { heading: number; roll: number; pitch: number };
  velocity: { surge: number; sway: number; heave: number };
  controls: {
    throttle: number;
    rudderAngle: number;
    ballast: number;
    bowThruster?: number;
  };
  properties: {
    mass: number;
    length: number;
    beam: number;
    draft: number;
  };
  yawRate?: number | null;
};

const formatValue = (value: number, digits = 2, suffix = '') =>
  Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : 'n/a';

const VesselDetailsPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const vesselId = typeof router.query.id === 'string' ? router.query.id : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vessel, setVessel] = useState<VesselDetails | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    if (!vesselId || status !== 'authenticated') return;
    let active = true;
    const loadVessel = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/vessels/by-id/${vesselId}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (!active) return;
        setVessel(data?.vessel || null);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load vessel details', err);
        setError(
          err instanceof Error ? err.message : 'Unable to load vessel details.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadVessel();
    return () => {
      active = false;
    };
  }, [apiBase, status, vesselId]);

  const motion = useMemo(() => {
    if (!vessel) return null;
    const worldVelocity = worldVelocityFromBody(
      vessel.orientation.heading,
      vessel.velocity,
    );
    const speed = speedFromWorldVelocity(worldVelocity) * 1.94384;
    const course = courseFromWorldVelocity(worldVelocity);
    return { speed, course };
  }, [vessel]);

  if (status === 'loading') {
    return <div className={styles.page}>Loading vessel...</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className={styles.page}>
        <div className={styles.title}>Vessel details</div>
        <p className={styles.subtitle}>Sign in to view vessel data.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Vessel {vessel?.id || vesselId}</div>
          <div className={styles.subtitle}>
            {vessel ? `Space ${vessel.spaceId}` : 'Loading vessel metadata'}
          </div>
        </div>
        <Link href="/sim" className={styles.backLink}>
          Back to sim
        </Link>
      </div>

      {loading ? <div className={styles.status}>Loading vessel...</div> : null}
      {error ? <div className={styles.notice}>{error}</div> : null}

      {vessel ? (
        <>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Status</div>
              <div className={styles.cardValue}>
                {vessel.mode || 'unknown'}{' '}
                {vessel.desiredMode ? `(desired ${vessel.desiredMode})` : ''}
              </div>
              <div className={styles.cardMeta}>
                Owner {vessel.ownerId || 'n/a'}
              </div>
              <div className={styles.cardMeta}>
                Last update{' '}
                {vessel.lastUpdate
                  ? new Date(vessel.lastUpdate).toLocaleString()
                  : 'n/a'}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Position</div>
              <div className={styles.cardValue}>
                {formatValue(vessel.position.lat, 5)},{' '}
                {formatValue(vessel.position.lon, 5)}
              </div>
              <div className={styles.cardMeta}>
                Depth {formatValue(Math.abs(vessel.position.z), 1, ' m')}
              </div>
              <div className={styles.cardMeta}>
                Heading{' '}
                {formatValue(
                  ((vessel.orientation.heading * 180) / Math.PI + 360) % 360,
                  0,
                  ' deg',
                )}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Motion</div>
              <div className={styles.cardValue}>
                {motion ? formatValue(motion.speed, 1, ' kts') : 'n/a'}
              </div>
              <div className={styles.cardMeta}>
                COG {motion ? formatValue(motion.course, 0, ' deg') : 'n/a'}
              </div>
              <div className={styles.cardMeta}>
                Yaw rate {formatValue(vessel.yawRate ?? 0, 3, ' rad/s')}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Hull</div>
              <div className={styles.cardValue}>
                {formatValue(vessel.properties.length, 1, ' m')} x{' '}
                {formatValue(vessel.properties.beam, 1, ' m')}
              </div>
              <div className={styles.cardMeta}>
                Draft {formatValue(vessel.properties.draft, 1, ' m')}
              </div>
              <div className={styles.cardMeta}>
                Mass {formatValue(vessel.properties.mass / 1000, 0, ' t')}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Controls</div>
              <div className={styles.cardValue}>
                Throttle {formatValue(vessel.controls.throttle * 100, 0, '%')}
              </div>
              <div className={styles.cardMeta}>
                Rudder{' '}
                {formatValue(
                  (vessel.controls.rudderAngle * 180) / Math.PI,
                  1,
                  ' deg',
                )}
              </div>
              <div className={styles.cardMeta}>
                Ballast {formatValue(vessel.controls.ballast * 100, 0, '%')}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Crew</div>
              <div className={styles.cardValue}>
                Last crew activity{' '}
                {vessel.lastCrewAt
                  ? new Date(vessel.lastCrewAt).toLocaleString()
                  : 'n/a'}
              </div>
              <div className={styles.cardMeta}>
                AI traffic {vessel.isAi ? 'yes' : 'no'}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>History</div>
            <div className={styles.sectionSub}>
              Port call history, speed traces, and voyage stats will appear here
              once tracking is enabled.
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default VesselDetailsPage;
