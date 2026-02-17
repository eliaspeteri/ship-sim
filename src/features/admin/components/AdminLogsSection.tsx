import React from 'react';

import { adminUi as ui } from '../adminUi';

import type { LogEntry } from '../types';

export function AdminLogsSection({
  logs,
  logsError,
  onRefresh,
  onClear,
}: {
  logs: LogEntry[];
  logsError: string | null;
  onRefresh: () => void;
  onClear: () => void;
}): React.ReactElement {
  return (
    <div className={ui.section}>
      <div className={ui.sectionHeader}>
        <div className={ui.sectionTitle}>Live logs</div>
        <div className={ui.formRow}>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonSecondary}`}
            onClick={onRefresh}
          >
            Refresh
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonDanger}`}
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
      {logsError ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>{logsError}</div>
      ) : null}
      <div className={ui.logList}>
        {logs.length === 0 ? (
          <div className={ui.notice}>No logs collected yet.</div>
        ) : (
          logs.map(entry => (
            <div key={entry.id} className={ui.logItem}>
              <div className={ui.logMeta}>
                {new Date(entry.timestamp).toLocaleTimeString()} •{' '}
                {entry.level.toUpperCase()} • {entry.source}
              </div>
              <div>{entry.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
