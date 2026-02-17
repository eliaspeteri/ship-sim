import React from 'react';

import {
  ACCOUNT_DECIMALS,
  ECONOMY_TRANSACTIONS_LIMIT,
  PERCENT_DECIMALS,
  PERCENT_SCALE,
  SAFETY_SCORE_DECIMALS,
  TRANSACTION_AMOUNT_DECIMALS,
  XP_DECIMALS,
} from '../constants';
import { formatTransactionReason } from '../format';
import { hudStyles as styles } from '../hudStyles';

import type { AccountState } from '../../../store';
import type {
  MissionAssignmentData,
  MissionDefinition,
} from '../../../types/mission.types';
import type { EconomyTransaction } from '../types';

export function HudMissionsPanel({
  account,
  socketLatencyMs,
  rankProgress,
  xpToNext,
  economyLoading,
  economyError,
  economyTransactions,
  activeAssignments,
  missions,
  assignmentsByMission,
  canAcceptMissions,
  missionError,
  missionBusyId,
  onAssignMission,
}: {
  account: AccountState;
  socketLatencyMs: number | null;
  rankProgress: number;
  xpToNext: number;
  economyLoading: boolean;
  economyError: string | null;
  economyTransactions: EconomyTransaction[];
  activeAssignments: MissionAssignmentData[];
  missions: MissionDefinition[];
  assignmentsByMission: Map<string, MissionAssignmentData>;
  canAcceptMissions: boolean;
  missionError: string | null;
  missionBusyId: string | null;
  onAssignMission: (missionId: string) => void;
}) {
  return (
    <div className={styles.sectionGrid}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Account snapshot</div>
        <div className={styles.accountGrid}>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Rank</div>
            <div className={styles.accountValue}>{account.rank}</div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Credits</div>
            <div className={styles.accountValue}>
              {account.credits.toFixed(ACCOUNT_DECIMALS)}
            </div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Experience</div>
            <div className={styles.accountValue}>
              {account.experience.toFixed(ACCOUNT_DECIMALS)}
            </div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Safety</div>
            <div className={styles.accountValue}>
              {account.safetyScore.toFixed(SAFETY_SCORE_DECIMALS)}
            </div>
          </div>
          <div className={styles.accountCard}>
            <div className={styles.accountLabel}>Latency</div>
            <div className={styles.accountValue}>
              {socketLatencyMs !== null
                ? `${Math.round(socketLatencyMs)} ms`
                : '—'}
            </div>
          </div>
        </div>
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${(rankProgress * PERCENT_SCALE).toFixed(
                  PERCENT_DECIMALS,
                )}%`,
              }}
            />
          </div>
          <div className={styles.progressMeta}>
            Next rank in {xpToNext.toFixed(XP_DECIMALS)} XP
          </div>
        </div>
        <div className={styles.sectionSub}>
          Missions award credits and XP. Operating costs and port fees deduct
          credits while you sail; safety penalties apply for collisions or speed
          violations in regulated spaces.
        </div>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Recent activity</div>
        {economyLoading ? (
          <div className={styles.sectionSub}>Loading economy...</div>
        ) : null}
        {economyError ? (
          <div className={styles.sectionSub}>{economyError}</div>
        ) : null}
        {!economyLoading && economyTransactions.length === 0 ? (
          <div className={styles.sectionSub}>
            No recent economy activity yet.
          </div>
        ) : null}
        {economyTransactions.length > 0 ? (
          <div className={styles.transactionList}>
            {economyTransactions
              .slice(0, ECONOMY_TRANSACTIONS_LIMIT)
              .map(tx => (
                <div key={tx.id} className={styles.transactionRow}>
                  <div>
                    <div className={styles.transactionLabel}>
                      {formatTransactionReason(tx.reason)}
                    </div>
                    <div className={styles.transactionMeta}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`${styles.transactionAmount} ${
                      tx.amount >= 0
                        ? styles.transactionPositive
                        : styles.transactionNegative
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount.toFixed(TRANSACTION_AMOUNT_DECIMALS)} cr
                  </div>
                </div>
              ))}
          </div>
        ) : null}
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Active assignments</div>
        {activeAssignments.length === 0 ? (
          <div className={styles.sectionSub}>
            No active missions. Accept a contract to start.
          </div>
        ) : (
          <div className={styles.assignmentList}>
            {activeAssignments.map(assignment => {
              const mission =
                assignment.mission ||
                missions.find(m => m.id === assignment.missionId);
              return (
                <div key={assignment.id} className={styles.assignmentCard}>
                  <div>
                    <div className={styles.assignmentTitle}>
                      {mission?.name || 'Mission'}
                    </div>
                    <div className={styles.assignmentMeta}>
                      Status: {assignment.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className={styles.assignmentMeta}>
                    Reward: {mission?.rewardCredits ?? 0} cr
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Available missions</div>
        {missionError ? (
          <div className={styles.sectionSub}>{missionError}</div>
        ) : null}
        {missions.length === 0 ? (
          <div className={styles.sectionSub}>
            No contracts published for this space yet.
          </div>
        ) : (
          <div className={styles.missionList}>
            {missions.map(mission => {
              const assignment = assignmentsByMission.get(mission.id);
              const locked = account.rank < mission.requiredRank;
              const disabled =
                !canAcceptMissions ||
                locked ||
                Boolean(assignment) ||
                missionBusyId === mission.id;
              return (
                <div key={mission.id} className={styles.missionCard}>
                  <div className={styles.missionHeader}>
                    <div>
                      <div className={styles.missionTitle}>{mission.name}</div>
                      <div className={styles.missionMeta}>
                        {mission.description || '—'}
                      </div>
                    </div>
                    <div className={styles.missionMeta}>
                      Rank {mission.requiredRank}
                    </div>
                  </div>
                  <div className={styles.missionFooter}>
                    <div className={styles.missionMeta}>
                      Reward {mission.rewardCredits} cr
                    </div>
                    <button
                      type="button"
                      className={styles.missionButton}
                      disabled={disabled}
                      onClick={() => onAssignMission(mission.id)}
                    >
                      {assignment
                        ? 'Assigned'
                        : locked
                          ? 'Locked'
                          : missionBusyId === mission.id
                            ? 'Assigning…'
                            : 'Accept'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
