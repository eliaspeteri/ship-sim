import React from 'react';
import { adminUi as ui } from '../adminUi';
import type { ModerationEntry } from '../types';

type ModerationForm = {
  userId: string;
  username: string;
  reason: string;
  expiresAt: string;
};

export function AdminModerationSection({
  moderationSpace,
  setModerationSpace,
  moderationError,
  fetchModeration,
  banForm,
  setBanForm,
  muteForm,
  setMuteForm,
  bans,
  mutes,
  submitModeration,
  deleteModeration,
  kickForm,
  setKickForm,
  kickMessage,
  sendKick,
}: {
  moderationSpace: string;
  setModerationSpace: (next: string) => void;
  moderationError: string | null;
  fetchModeration: () => void;
  banForm: ModerationForm;
  setBanForm: React.Dispatch<React.SetStateAction<ModerationForm>>;
  muteForm: ModerationForm;
  setMuteForm: React.Dispatch<React.SetStateAction<ModerationForm>>;
  bans: ModerationEntry[];
  mutes: ModerationEntry[];
  submitModeration: (
    endpoint: 'bans' | 'mutes',
    payload: ModerationForm,
  ) => void;
  deleteModeration: (endpoint: 'bans' | 'mutes', id: string) => void;
  kickForm: { userId: string; reason: string };
  setKickForm: React.Dispatch<
    React.SetStateAction<{ userId: string; reason: string }>
  >;
  kickMessage: string | null;
  sendKick: () => void;
}): React.ReactElement {
  const renderEntries = (
    entries: ModerationEntry[],
    endpoint: 'bans' | 'mutes',
  ) => (
    <div className={ui.logList}>
      {entries.length === 0 ? (
        <div className={ui.subtitle}>
          {endpoint === 'bans' ? 'No active bans.' : 'No active mutes.'}
        </div>
      ) : (
        entries.map(entry => (
          <div key={entry.id} className={ui.logItem}>
            <div className={ui.logMeta}>
              {entry.userId || entry.username || 'Unknown'} •{' '}
              {entry.reason || 'No reason'}
            </div>
            <button
              type="button"
              className={`${ui.button} ${ui.buttonDanger}`}
              onClick={() => deleteModeration(endpoint, entry.id)}
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={ui.section}>
      <div className={ui.sectionHeader}>
        <div className={ui.sectionTitle}>Moderation</div>
        <div className={ui.formRow}>
          <input
            className={ui.input}
            value={moderationSpace}
            onChange={e => setModerationSpace(e.target.value)}
            placeholder="space id"
          />
          <button
            type="button"
            className={`${ui.button} ${ui.buttonSecondary}`}
            onClick={fetchModeration}
          >
            Load
          </button>
        </div>
      </div>
      {moderationError ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>
          {moderationError}
        </div>
      ) : null}
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardLabel}>Bans</div>
          <div className={ui.formRow}>
            <input
              className={ui.input}
              value={banForm.userId}
              onChange={e =>
                setBanForm(prev => ({ ...prev, userId: e.target.value }))
              }
              placeholder="user id"
            />
            <input
              className={ui.input}
              value={banForm.username}
              onChange={e =>
                setBanForm(prev => ({ ...prev, username: e.target.value }))
              }
              placeholder="username"
            />
            <input
              className={ui.input}
              value={banForm.reason}
              onChange={e =>
                setBanForm(prev => ({ ...prev, reason: e.target.value }))
              }
              placeholder="reason"
            />
            <input
              className={ui.input}
              value={banForm.expiresAt}
              onChange={e =>
                setBanForm(prev => ({ ...prev, expiresAt: e.target.value }))
              }
              type="datetime-local"
              placeholder="expires"
            />
            <button
              type="button"
              className={`${ui.button} ${ui.buttonPrimary}`}
              onClick={() => submitModeration('bans', banForm)}
            >
              Ban
            </button>
          </div>
          {renderEntries(bans, 'bans')}
        </div>

        <div className={ui.card}>
          <div className={ui.cardLabel}>Mutes</div>
          <div className={ui.formRow}>
            <input
              className={ui.input}
              value={muteForm.userId}
              onChange={e =>
                setMuteForm(prev => ({ ...prev, userId: e.target.value }))
              }
              placeholder="user id"
            />
            <input
              className={ui.input}
              value={muteForm.username}
              onChange={e =>
                setMuteForm(prev => ({ ...prev, username: e.target.value }))
              }
              placeholder="username"
            />
            <input
              className={ui.input}
              value={muteForm.reason}
              onChange={e =>
                setMuteForm(prev => ({ ...prev, reason: e.target.value }))
              }
              placeholder="reason"
            />
            <input
              className={ui.input}
              value={muteForm.expiresAt}
              onChange={e =>
                setMuteForm(prev => ({ ...prev, expiresAt: e.target.value }))
              }
              type="datetime-local"
              placeholder="expires"
            />
            <button
              type="button"
              className={`${ui.button} ${ui.buttonPrimary}`}
              onClick={() => submitModeration('mutes', muteForm)}
            >
              Mute
            </button>
          </div>
          {renderEntries(mutes, 'mutes')}
        </div>

        <div className={ui.card}>
          <div className={ui.cardLabel}>Kick user</div>
          <div className={ui.formRow}>
            <input
              className={ui.input}
              value={kickForm.userId}
              onChange={e =>
                setKickForm(prev => ({ ...prev, userId: e.target.value }))
              }
              placeholder="user id"
            />
            <input
              className={ui.input}
              value={kickForm.reason}
              onChange={e =>
                setKickForm(prev => ({ ...prev, reason: e.target.value }))
              }
              placeholder="reason"
            />
            <button
              type="button"
              className={`${ui.button} ${ui.buttonDanger}`}
              onClick={sendKick}
            >
              Kick now
            </button>
          </div>
          {kickMessage ? (
            <div className={`${ui.notice} ${ui.noticeInfo}`}>{kickMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
