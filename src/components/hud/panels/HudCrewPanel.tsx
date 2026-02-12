import React from 'react';
import { hudStyles as styles } from '../hudStyles';

export function HudCrewPanel({
  crewRoster,
  stationByUser,
  helmStation,
  engineStation,
  radioStation,
  sessionUserId,
  crewIds,
  isAdmin,
  onRequestStation,
}: {
  crewRoster: Array<{ id: string; name: string }>;
  stationByUser: Map<string, string[]>;
  helmStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  engineStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  radioStation:
    | { userId?: string | null; username?: string | null }
    | null
    | undefined;
  sessionUserId?: string | null;
  crewIds: string[];
  isAdmin: boolean;
  onRequestStation: (
    station: 'helm' | 'engine' | 'radio',
    action: 'claim' | 'release',
  ) => void;
}) {
  return (
    <div className={styles.sectionCard}>
      <div className="flex items-center justify-between">
        <div className={styles.sectionTitle}>Crew & stations</div>
        <div className={styles.sectionSub}>{crewRoster.length || 0} aboard</div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className={styles.sectionTitle}>Roster</div>
          <div className="mt-2 space-y-2">
            {crewRoster.length === 0 ? (
              <div className="text-xs text-gray-500">
                Awaiting crew assignments.
              </div>
            ) : (
              crewRoster.map(member => (
                <div key={member.id} className={styles.crewRow}>
                  <div className="text-sm font-semibold text-white">
                    {member.name}
                  </div>
                  <div className="flex items-center gap-1">
                    {(stationByUser.get(member.id) || []).map(station => (
                      <span
                        key={`${member.id}-${station}`}
                        className={styles.badge}
                      >
                        {station}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className={styles.sectionTitle}>Stations</div>
          <div className="mt-2 space-y-2">
            {[
              {
                key: 'helm',
                label: 'Helm',
                station: helmStation,
                description: 'Steer the vessel and manage heading.',
              },
              {
                key: 'engine',
                label: 'Engine',
                station: engineStation,
                description: 'Throttle and ballast controls.',
              },
              {
                key: 'radio',
                label: 'Radio',
                station: radioStation,
                description: 'Communications and broadcasts.',
              },
            ].map(item => {
              const holderId = item.station?.userId || null;
              const holderName =
                item.station?.username || holderId || 'Unassigned';
              const isSelf = sessionUserId && holderId === sessionUserId;
              const canClaim =
                (sessionUserId && crewIds.includes(sessionUserId)) || isAdmin;
              const isHeldByOther = Boolean(
                holderId && sessionUserId && holderId !== sessionUserId,
              );
              const action: 'claim' | 'release' = isSelf ? 'release' : 'claim';
              const disabled = !canClaim || (isHeldByOther && !isAdmin);
              return (
                <div key={item.key} className={styles.crewRow}>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {holderId ? `Held by ${holderName}` : 'Unassigned'}
                    </div>
                    <div className={styles.stationHint}>{item.description}</div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onRequestStation(
                        item.key as 'helm' | 'engine' | 'radio',
                        action,
                      )
                    }
                    className={`${styles.stationButton} ${
                      disabled ? styles.stationButtonDisabled : ''
                    }`}
                  >
                    {isSelf ? 'Release' : 'Claim'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
