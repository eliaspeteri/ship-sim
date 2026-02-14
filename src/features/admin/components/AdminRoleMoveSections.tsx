import React from 'react';
import { adminUi as ui } from '../adminUi';

export function AdminRoleSection({
  roleUserId,
  setRoleUserId,
  roleValue,
  setRoleValue,
  roleMessage,
  updateUserRole,
}: {
  roleUserId: string;
  setRoleUserId: (next: string) => void;
  roleValue: string;
  setRoleValue: (next: string) => void;
  roleMessage: string | null;
  updateUserRole: () => void;
}): React.ReactElement {
  return (
    <div className={ui.section}>
      <div className={ui.sectionHeader}>
        <div className={ui.sectionTitle}>Role management</div>
      </div>
      <div className={ui.formRow}>
        <input
          className={ui.input}
          value={roleUserId}
          onChange={e => setRoleUserId(e.target.value)}
          placeholder="user id"
        />
        <select
          className={ui.select}
          value={roleValue}
          onChange={e => setRoleValue(e.target.value)}
        >
          <option value="guest">Guest</option>
          <option value="spectator">Spectator</option>
          <option value="player">Player</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="button"
          className={`${ui.button} ${ui.buttonPrimary}`}
          onClick={updateUserRole}
        >
          Update role
        </button>
      </div>
      {roleMessage ? (
        <div className={`${ui.notice} ${ui.noticeInfo}`}>{roleMessage}</div>
      ) : null}
    </div>
  );
}

export function AdminRepositionSection({
  moveForm,
  setMoveForm,
  moveMessage,
  sendMove,
}: {
  moveForm: { vesselId: string; lat: string; lon: string };
  setMoveForm: React.Dispatch<
    React.SetStateAction<{ vesselId: string; lat: string; lon: string }>
  >;
  moveMessage: string | null;
  sendMove: () => void;
}): React.ReactElement {
  return (
    <div className={ui.section}>
      <div className={ui.sectionHeader}>
        <div className={ui.sectionTitle}>Reposition vessel</div>
      </div>
      <div className={ui.formRow}>
        <input
          className={ui.input}
          value={moveForm.vesselId}
          onChange={e =>
            setMoveForm(prev => ({ ...prev, vesselId: e.target.value }))
          }
          placeholder="vessel id"
        />
        <input
          className={ui.input}
          value={moveForm.lat}
          onChange={e =>
            setMoveForm(prev => ({ ...prev, lat: e.target.value }))
          }
          placeholder="lat"
        />
        <input
          className={ui.input}
          value={moveForm.lon}
          onChange={e =>
            setMoveForm(prev => ({ ...prev, lon: e.target.value }))
          }
          placeholder="lon"
        />
        <button
          type="button"
          className={`${ui.button} ${ui.buttonPrimary}`}
          onClick={sendMove}
        >
          Teleport
        </button>
      </div>
      {moveMessage ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>{moveMessage}</div>
      ) : null}
      <div className={ui.subtitle}>
        Spectator drag handles are also available in the sim view.
      </div>
    </div>
  );
}
