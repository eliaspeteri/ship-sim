import React from 'react';

import { spacesUi as ui } from '../spacesUi';

import type { Rules } from '../../../types/rules.types';
import type { ManagedSpace, SpaceDraft, SpaceVisibility } from '../types';

type SpaceCardProps = {
  space: ManagedSpace;
  draft: SpaceDraft | undefined;
  isAdmin: boolean;
  scope: 'mine' | 'all';
  updateDraft: (spaceId: string, patch: Partial<SpaceDraft>) => void;
  updateRules: (spaceId: string, updater: (rules: Rules) => Rules) => void;
  ensureCustomRules: (spaceId: string, rulesetType: string) => void;
  handleRegenerateInvite: (spaceId: string) => void;
  handleClearPassword: (spaceId: string) => void;
  handleSave: (spaceId: string) => void;
  handleDelete: (
    spaceId: string,
    totalVessels: number,
    activeVessels: number,
  ) => void;
  setNotice: (notice: string | null) => void;
  parseListInput: (value: string) => string[];
};

export function SpaceCard({
  space,
  draft,
  isAdmin,
  scope,
  updateDraft,
  updateRules,
  ensureCustomRules,
  handleRegenerateInvite,
  handleClearPassword,
  handleSave,
  handleDelete,
  setNotice,
  parseListInput,
}: SpaceCardProps): React.ReactElement {
  const inviteToken = space.inviteToken || '—';
  const totalVessels = space.totalVessels ?? 0;
  const activeVessels = space.activeVessels ?? 0;
  const hasTraffic = activeVessels > 0;

  return (
    <div className={ui.spaceCard} data-testid={`space-card-${space.id}`}>
      <div className={ui.cardHeader}>
        <div>
          <div className={ui.cardMeta}>Space ID</div>
          <div className={`${ui.cardMeta} ${ui.mono}`}>{space.id}</div>
        </div>
        <div className={ui.actionsRow}>
          <span
            className={`${ui.tag} ${
              space.visibility === 'private' ? ui.tagPrivate : ''
            }`}
          >
            {space.visibility}
          </span>
          <span className={ui.tag}>{space.rulesetType || 'CASUAL'}</span>
          {space.passwordProtected ? (
            <span className={ui.tag}>Password</span>
          ) : null}
          <span className={ui.tag}>Vessels {totalVessels}</span>
          {hasTraffic ? (
            <span className={ui.tag}>Active {activeVessels}</span>
          ) : null}
        </div>
      </div>
      {scope === 'all' && isAdmin ? (
        <div className={ui.cardMeta}>Owner: {space.createdBy || 'Unknown'}</div>
      ) : null}

      <div className={ui.formGrid}>
        <label className={ui.cardMeta}>
          Name
          <input
            className={ui.input}
            value={draft?.name || space.name}
            onChange={e => updateDraft(space.id, { name: e.target.value })}
          />
        </label>

        <label className={ui.cardMeta}>
          Visibility
          <select
            className={ui.select}
            value={draft?.visibility || space.visibility}
            onChange={e =>
              updateDraft(space.id, {
                visibility: e.target.value as SpaceVisibility,
              })
            }
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>

        <label className={ui.cardMeta}>
          Ruleset
          <select
            className={ui.select}
            value={draft?.rulesetType || space.rulesetType || 'CASUAL_PUBLIC'}
            onChange={e =>
              updateDraft(space.id, { rulesetType: e.target.value })
            }
          >
            <option value="CASUAL">Casual</option>
            <option value="REALISM">Realism</option>
            <option value="CUSTOM">Custom</option>
            <option value="EXAM">Exam</option>
          </select>
        </label>

        <label className={ui.cardMeta}>
          New password
          <input
            className={ui.input}
            value={draft?.password || ''}
            onChange={e => updateDraft(space.id, { password: e.target.value })}
            type="password"
            placeholder="Leave blank to keep"
          />
        </label>
      </div>

      {isAdmin ? (
        <div className={ui.rulesSection}>
          <div className={ui.cardMeta}>Rules overrides</div>
          {draft?.rules ? (
            <>
              <div className={ui.rulesGrid}>
                <div className={ui.rulesGroup}>
                  <div className={ui.cardMeta}>Assists</div>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.assists.stability}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          assists: {
                            ...rules.assists,
                            stability: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Stability</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.assists.autopilot}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          assists: {
                            ...rules.assists,
                            autopilot: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Autopilot</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.assists.docking}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          assists: {
                            ...rules.assists,
                            docking: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Docking</span>
                  </label>
                </div>

                <div className={ui.rulesGroup}>
                  <div className={ui.cardMeta}>Realism</div>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.realism.damage}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          realism: {
                            ...rules.realism,
                            damage: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Damage</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.realism.wear}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          realism: { ...rules.realism, wear: e.target.checked },
                        }))
                      }
                    />
                    <span>Wear</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.realism.failures}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          realism: {
                            ...rules.realism,
                            failures: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Failures</span>
                  </label>
                </div>

                <div className={ui.rulesGroup}>
                  <div className={ui.cardMeta}>Enforcement</div>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.enforcement.colregs}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          enforcement: {
                            ...rules.enforcement,
                            colregs: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>COLREGS</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.enforcement.penalties}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          enforcement: {
                            ...rules.enforcement,
                            penalties: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Penalties</span>
                  </label>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.enforcement.investigations}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          enforcement: {
                            ...rules.enforcement,
                            investigations: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Investigations</span>
                  </label>
                </div>

                <div className={ui.rulesGroup}>
                  <div className={ui.cardMeta}>Progression</div>
                  <label className={ui.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={draft.rules.progression.scoring}
                      onChange={e =>
                        updateRules(space.id, rules => ({
                          ...rules,
                          progression: {
                            ...rules.progression,
                            scoring: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Scoring</span>
                  </label>
                </div>
              </div>
              <div className={ui.rulesInputs}>
                <label className={ui.cardMeta}>
                  Allowed vessels
                  <input
                    className={ui.input}
                    value={draft.rules.allowedVessels.join(', ')}
                    onChange={e =>
                      updateRules(space.id, rules => ({
                        ...rules,
                        allowedVessels: parseListInput(e.target.value),
                      }))
                    }
                    placeholder="cargo, tug, ferry"
                  />
                </label>
                <label className={ui.cardMeta}>
                  Allowed mods
                  <input
                    className={ui.input}
                    value={draft.rules.allowedMods.join(', ')}
                    onChange={e =>
                      updateRules(space.id, rules => ({
                        ...rules,
                        allowedMods: parseListInput(e.target.value),
                      }))
                    }
                    placeholder="mod-id, mod-id-2"
                  />
                </label>
              </div>
              <div className={ui.formRow}>
                <button
                  type="button"
                  className={`${ui.button} ${ui.buttonSecondary}`}
                  onClick={() =>
                    updateDraft(space.id, { rules: null, rulesTouched: true })
                  }
                >
                  Clear overrides
                </button>
              </div>
            </>
          ) : (
            <div className={ui.formRow}>
              <div className={ui.cardMeta}>
                Using {draft?.rulesetType || space.rulesetType || 'CASUAL'}{' '}
                defaults.
              </div>
              <button
                type="button"
                className={`${ui.button} ${ui.buttonSecondary}`}
                onClick={() =>
                  ensureCustomRules(
                    space.id,
                    draft?.rulesetType || space.rulesetType || 'CASUAL',
                  )
                }
              >
                Customize rules
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className={ui.formRow}>
        <div className={ui.cardMeta}>
          Invite token:{' '}
          <span className={`${ui.mono} ${ui.cardMeta}`}>{inviteToken}</span>
        </div>
        <div className={ui.actionsRow}>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonSecondary}`}
            onClick={() => {
              if (typeof navigator !== 'undefined') {
                void navigator.clipboard.writeText(inviteToken);
                setNotice('Invite token copied.');
              }
            }}
          >
            Copy token
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonSecondary}`}
            onClick={() => handleRegenerateInvite(space.id)}
            disabled={draft?.saving}
          >
            Regenerate invite
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonSecondary}`}
            onClick={() => handleClearPassword(space.id)}
            disabled={draft?.saving}
          >
            Clear password
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonPrimary}`}
            onClick={() => handleSave(space.id)}
            disabled={draft?.saving}
          >
            Save changes
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonDanger}`}
            onClick={() => handleDelete(space.id, totalVessels, activeVessels)}
            disabled={draft?.saving || totalVessels > 0}
          >
            Delete
          </button>
        </div>
      </div>

      {draft?.error ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>{draft.error}</div>
      ) : null}
      {totalVessels > 0 ? (
        <div className={ui.cardMeta}>
          Delete is disabled while vessels exist in this space.
        </div>
      ) : null}
    </div>
  );
}
