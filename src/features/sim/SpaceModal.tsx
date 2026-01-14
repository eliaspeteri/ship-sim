import React from 'react';
import styles from '../../pages/SimPage.module.css';
import { Rules } from '../../types/rules.types';
import { SpaceFlow, SpaceSummary } from './types';

const SPACE_RULE_DEFAULT = 'CASUAL';

type SpaceModalProps = {
  isOpen: boolean;
  flow: SpaceFlow;
  spaces: SpaceSummary[];
  spacesLoading: boolean;
  spaceInput: string;
  setSpaceInput: (value: string) => void;
  selectedSpaceRules: Rules | null;
  knownSpaces: SpaceSummary[];
  inviteToken: string;
  setInviteToken: (value: string) => void;
  invitePassword: string;
  setInvitePassword: (value: string) => void;
  newSpaceName: string;
  setNewSpaceName: (value: string) => void;
  newSpaceVisibility: 'public' | 'private';
  setNewSpaceVisibility: (value: 'public' | 'private') => void;
  newSpaceRulesetType: string;
  setNewSpaceRulesetType: (value: string) => void;
  newSpacePassword: string;
  setNewSpacePassword: (value: string) => void;
  spaceError: string | null;
  setSpaceError: (value: string | null) => void;
  onJoinSpace: (spaceId: string) => void;
  onFetchSpaces: (opts?: { inviteToken?: string; password?: string }) => void;
  onCreateSpace: () => void;
  onClose: () => void;
  onFlowChange: (flow: SpaceFlow) => void;
};

export function SpaceModal({
  isOpen,
  flow,
  spaces,
  spacesLoading,
  spaceInput,
  setSpaceInput,
  selectedSpaceRules,
  knownSpaces,
  inviteToken,
  setInviteToken,
  invitePassword,
  setInvitePassword,
  newSpaceName,
  setNewSpaceName,
  newSpaceVisibility,
  setNewSpaceVisibility,
  newSpaceRulesetType,
  setNewSpaceRulesetType,
  newSpacePassword,
  setNewSpacePassword,
  spaceError,
  setSpaceError,
  onJoinSpace,
  onFetchSpaces,
  onCreateSpace,
  onClose,
  onFlowChange,
}: SpaceModalProps) {
  if (!isOpen) return null;

  const activeSpace = spaces.find(space => space.id === spaceInput);

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => {
        onClose();
        onFlowChange('choice');
        setSpaceError(null);
      }}
    >
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            {flow !== 'choice' ? (
              <button
                className={styles.modalBack}
                onClick={() => {
                  onFlowChange('choice');
                  setSpaceError(null);
                }}
              >
                <span aria-hidden="true">←</span>
                Back
              </button>
            ) : (
              <div className={styles.modalSpacer} />
            )}
            <div className={styles.modalTitle}>Choose a space</div>
          </div>
          <button
            className={styles.modalClose}
            onClick={() => {
              onClose();
              onFlowChange('choice');
              setSpaceError(null);
            }}
          >
            ✕ Close
          </button>
        </div>
        {flow === 'choice' ? (
          <div className={styles.choiceGrid}>
            <button
              className={`${styles.choiceButton} ${styles.choiceButtonPrimary}`}
              onClick={() => {
                onFlowChange('join');
                setSpaceError(null);
              }}
            >
              Join space
            </button>
            <button
              className={styles.choiceButton}
              onClick={() => {
                onFlowChange('create');
                setSpaceError(null);
              }}
            >
              Create space
            </button>
          </div>
        ) : null}

        {flow === 'join' ? (
          <>
            <div className={styles.formRow}>
              <span className={styles.modeLabel}>Space</span>
              <input
                className={styles.input}
                value={spaceInput}
                onChange={e => setSpaceInput(e.target.value)}
                placeholder="global"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  setSpaceError(null);
                  onJoinSpace(spaceInput);
                }}
              >
                Join
              </button>
              <button
                className={`${styles.button} ${styles.buttonNeutral}`}
                onClick={() => {
                  onFlowChange('choice');
                  setSpaceError(null);
                }}
              >
                Back
              </button>
            </div>
            <div className={styles.pillScroller}>
              <div className={styles.pillRow}>
                {spacesLoading ? <span>Loading spaces...</span> : null}
                {spaces.map(space => (
                  <button
                    key={space.id}
                    className={`${styles.pill} ${
                      space.visibility === 'private' ? styles.pillPrivate : ''
                    }`}
                    onClick={() => onJoinSpace(space.id)}
                    title={
                      space.visibility === 'private'
                        ? `Private space - ${space.rulesetType || SPACE_RULE_DEFAULT}`
                        : `Public space - ${space.rulesetType || SPACE_RULE_DEFAULT}`
                    }
                  >
                    <span className={styles.pillName}>{space.name}</span>
                    <span className={styles.pillBadges}>
                      <span className={styles.pillBadge}>
                        {space.visibility === 'private' ? 'Private' : 'Public'}
                      </span>
                      <span
                        className={`${styles.pillBadge} ${
                          space.rulesetType === 'SIM_PUBLIC' ||
                          space.rulesetType === 'REALISM'
                            ? styles.pillBadgeRealism
                            : space.rulesetType === 'TRAINING_EXAM' ||
                                space.rulesetType === 'EXAM'
                              ? styles.pillBadgeExam
                              : space.rulesetType === 'PRIVATE_SANDBOX' ||
                                  space.rulesetType === 'CUSTOM'
                                ? styles.pillBadgeSandbox
                                : styles.pillBadgeCasual
                        }`}
                      >
                        {space.rulesetType || SPACE_RULE_DEFAULT}
                      </span>
                    </span>
                  </button>
                ))}
                {!spacesLoading && spaces.length === 0 ? (
                  <span className={styles.helperText}>
                    No public spaces yet
                  </span>
                ) : null}
                {(knownSpaces?.length || 0) > 0 ? (
                  <span className={styles.helperText}>
                    Known spaces: {knownSpaces.length}
                  </span>
                ) : null}
              </div>
            </div>
            {spaces.length > 0 ? (
              <div className={styles.detailsCard}>
                <div className={styles.detailsHeader}>
                  <span>
                    Details for: <strong>{spaceInput || '—'}</strong>
                  </span>
                  {activeSpace?.inviteToken ? (
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={async () => {
                        const invite = activeSpace?.inviteToken;
                        if (invite) {
                          try {
                            await navigator.clipboard.writeText(invite);
                            setSpaceError(null);
                          } catch {
                            setSpaceError('Failed to copy invite token');
                          }
                        }
                      }}
                    >
                      Copy invite token
                    </button>
                  ) : null}
                </div>
                <div className={styles.helperText}>
                  Invite token: {activeSpace?.inviteToken || '—'}
                </div>
                {selectedSpaceRules ? (
                  <div className={styles.rulesGrid}>
                    <div className={styles.rulesRow}>
                      <span className={styles.rulesLabel}>Assists</span>
                      <span className={styles.rulesBadges}>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.assists.stability
                              ? styles.rulesBadgeOn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Stability
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.assists.autopilot
                              ? styles.rulesBadgeOn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Autopilot
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.assists.docking
                              ? styles.rulesBadgeOn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Docking
                        </span>
                      </span>
                    </div>
                    <div className={styles.rulesRow}>
                      <span className={styles.rulesLabel}>Realism</span>
                      <span className={styles.rulesBadges}>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.realism.damage
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Damage
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.realism.wear
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Wear
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.realism.failures
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Failures
                        </span>
                      </span>
                    </div>
                    <div className={styles.rulesRow}>
                      <span className={styles.rulesLabel}>Enforcement</span>
                      <span className={styles.rulesBadges}>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.enforcement.colregs
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          COLREG
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.enforcement.penalties
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Penalties
                        </span>
                        <span
                          className={`${styles.rulesBadge} ${
                            selectedSpaceRules.enforcement.investigations
                              ? styles.rulesBadgeWarn
                              : styles.rulesBadgeOff
                          }`}
                        >
                          Investigations
                        </span>
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
                placeholder="Invite code"
              />
              <input
                className={styles.input}
                value={invitePassword}
                onChange={e => setInvitePassword(e.target.value)}
                type="password"
                placeholder="Invite password"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => {
                  setSpaceError(null);
                  onFetchSpaces({ inviteToken, password: invitePassword });
                }}
              >
                Use invite
              </button>
            </div>
          </>
        ) : null}

        {flow === 'create' ? (
          <>
            <div className={styles.formRow}>
              <span className={styles.modeLabel}>Create a new space</span>
              <button
                className={`${styles.button} ${styles.buttonNeutral}`}
                onClick={() => {
                  onFlowChange('choice');
                  setSpaceError(null);
                }}
              >
                Back
              </button>
            </div>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={newSpaceName}
                onChange={e => setNewSpaceName(e.target.value)}
                placeholder="New space name"
              />
              <select
                className={styles.select}
                value={newSpaceVisibility}
                onChange={e =>
                  setNewSpaceVisibility(
                    e.target.value === 'private' ? 'private' : 'public',
                  )
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <select
                className={styles.select}
                value={newSpaceRulesetType}
                onChange={e => setNewSpaceRulesetType(e.target.value)}
              >
                <option value="CASUAL">Casual</option>
                <option value="REALISM">Realism</option>
                <option value="CUSTOM">Custom</option>
                <option value="EXAM">Exam</option>
              </select>
              <input
                className={styles.input}
                value={newSpacePassword}
                onChange={e => setNewSpacePassword(e.target.value)}
                type="password"
                placeholder="Password (optional)"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void onCreateSpace()}
              >
                Create
              </button>
            </div>
          </>
        ) : null}

        {spaceError ? (
          <div className={styles.errorText}>{spaceError}</div>
        ) : null}
      </div>
    </div>
  );
}
