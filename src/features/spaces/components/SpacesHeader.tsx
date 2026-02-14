import React from 'react';
import { spacesUi as ui } from '../spacesUi';

export function SpacesHeader({
  isAdmin,
  scope,
  setScope,
  loading,
  fetchSpaces,
  spaceCountLabel,
}: {
  isAdmin: boolean;
  scope: 'mine' | 'all';
  setScope: (scope: 'mine' | 'all') => void;
  loading: boolean;
  fetchSpaces: () => void;
  spaceCountLabel: string;
}): React.ReactElement {
  return (
    <div className={ui.header}>
      <div>
        <div className={ui.title}>Manage spaces</div>
        <p className={ui.subtitle}>
          {scope === 'all' && isAdmin
            ? `${spaceCountLabel} spaces across all creators.`
            : `${spaceCountLabel} created by you.`}{' '}
          Update visibility, share invites, or rotate passwords.
        </p>
      </div>
      <div className={ui.actionsRow}>
        {isAdmin ? (
          <div className={ui.toggleGroup}>
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`${ui.button} ${scope === 'mine' ? ui.buttonPrimary : ui.buttonSecondary}`}
              disabled={loading}
            >
              My spaces
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`${ui.button} ${scope === 'all' ? ui.buttonPrimary : ui.buttonSecondary}`}
              disabled={loading}
            >
              All spaces
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={fetchSpaces}
          className={`${ui.button} ${ui.buttonSecondary}`}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
