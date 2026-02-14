import React from 'react';
import { adminUi as ui } from '../adminUi';

export function AdminHeader({
  socketConnected,
}: {
  socketConnected: boolean;
}): React.ReactElement {
  return (
    <div className={ui.header}>
      <div>
        <div className={ui.title}>Admin console</div>
        <div className={ui.subtitle}>
          Moderation, environment control, and performance budgets.
        </div>
      </div>
      <div className={ui.subtitle}>
        Socket status: {socketConnected ? 'connected' : 'offline'}
      </div>
    </div>
  );
}
