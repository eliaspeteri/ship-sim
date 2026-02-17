import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import VesselHeader from '../../features/vessels/components/VesselHeader';
import VesselHistorySection from '../../features/vessels/components/VesselHistorySection';
import VesselStatsGrid from '../../features/vessels/components/VesselStatsGrid';
import VesselStatus from '../../features/vessels/components/VesselStatus';
import { getApiBase } from '../../lib/api';
import {
  courseFromWorldVelocity,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../../lib/position';

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
  const router = useRouter();
  const vesselId = typeof router.query.id === 'string' ? router.query.id : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vessel, setVessel] = useState<VesselDetails | null>(null);
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    if (!vesselId) return;
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
          throw new Error(
            data?.error || `Unable to load vessel (${res.status}).`,
          );
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
  }, [apiBase, vesselId]);

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

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-[60px] pt-8 text-[var(--ink)]">
      <VesselHeader
        title={`Vessel ${vessel?.id || vesselId}`}
        subtitle={
          vessel ? `Space ${vessel.spaceId}` : 'Loading vessel metadata'
        }
      />

      <VesselStatus loading={loading} error={error} />

      {vessel ? (
        <>
          <div className="mt-5">
            <VesselStatsGrid
              cards={[
                {
                  label: 'Status',
                  value: (
                    <>
                      {vessel.mode || 'unknown'}{' '}
                      {vessel.desiredMode
                        ? `(desired ${vessel.desiredMode})`
                        : ''}
                    </>
                  ),
                  meta: [
                    <>Owner {vessel.ownerId || 'n/a'}</>,
                    <>
                      Last update{' '}
                      {vessel.lastUpdate
                        ? new Date(vessel.lastUpdate).toLocaleString()
                        : 'n/a'}
                    </>,
                  ],
                },
                {
                  label: 'Position',
                  value: (
                    <>
                      {formatValue(vessel.position.lat, 5)},{' '}
                      {formatValue(vessel.position.lon, 5)}
                    </>
                  ),
                  meta: [
                    <>
                      Depth {formatValue(Math.abs(vessel.position.z), 1, ' m')}
                    </>,
                    <>
                      Heading{' '}
                      {formatValue(
                        ((vessel.orientation.heading * 180) / Math.PI + 360) %
                          360,
                        0,
                        ' deg',
                      )}
                    </>,
                  ],
                },
                {
                  label: 'Motion',
                  value: motion ? formatValue(motion.speed, 1, ' kts') : 'n/a',
                  meta: [
                    <>
                      COG{' '}
                      {motion ? formatValue(motion.course, 0, ' deg') : 'n/a'}
                    </>,
                    <>
                      Yaw rate {formatValue(vessel.yawRate ?? 0, 3, ' rad/s')}
                    </>,
                  ],
                },
                {
                  label: 'Hull',
                  value: (
                    <>
                      {formatValue(vessel.properties.length, 1, ' m')} x{' '}
                      {formatValue(vessel.properties.beam, 1, ' m')}
                    </>
                  ),
                  meta: [
                    <>Draft {formatValue(vessel.properties.draft, 1, ' m')}</>,
                    <>
                      Mass {formatValue(vessel.properties.mass / 1000, 0, ' t')}
                    </>,
                  ],
                },
                {
                  label: 'Controls',
                  value: (
                    <>
                      Throttle{' '}
                      {formatValue(vessel.controls.throttle * 100, 0, '%')}
                    </>
                  ),
                  meta: [
                    <>
                      Rudder{' '}
                      {formatValue(
                        (vessel.controls.rudderAngle * 180) / Math.PI,
                        1,
                        ' deg',
                      )}
                    </>,
                    <>
                      Ballast{' '}
                      {formatValue(vessel.controls.ballast * 100, 0, '%')}
                    </>,
                  ],
                },
                {
                  label: 'Crew',
                  value: (
                    <>
                      Last crew activity{' '}
                      {vessel.lastCrewAt
                        ? new Date(vessel.lastCrewAt).toLocaleString()
                        : 'n/a'}
                    </>
                  ),
                  meta: [<>AI traffic {vessel.isAi ? 'yes' : 'no'}</>],
                },
              ]}
            />
          </div>

          <VesselHistorySection />
        </>
      ) : null}
    </div>
  );
};

export default VesselDetailsPage;
