import React from 'react';

import { adminUi as ui, metricTargets } from '../adminUi';

import type { ServerMetrics } from '../types';

export function AdminPerformanceSection({
  metrics,
  metricsError,
}: {
  metrics: ServerMetrics | null;
  metricsError: string | null;
}): React.ReactElement {
  const metricCards = metrics
    ? [
        { key: 'api', label: 'API latency', bucket: metrics.api },
        {
          key: 'broadcast',
          label: 'Broadcast loop',
          bucket: metrics.broadcast,
        },
        { key: 'ai', label: 'AI loop', bucket: metrics.ai },
        {
          key: 'socketLatency',
          label: 'Socket RTT',
          bucket: metrics.socketLatency,
        },
      ]
    : [];
  const spaceMetrics = metrics
    ? Object.values(metrics.spaces || {}).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    : [];

  return (
    <div className={ui.section}>
      <div className={ui.sectionHeader}>
        <div className={ui.sectionTitle}>Performance budgets</div>
        <div className={ui.subtitle}>
          Target 60 Hz sim • 16 ms render budget
        </div>
      </div>
      {metricsError ? (
        <div className={`${ui.notice} ${ui.noticeError}`}>{metricsError}</div>
      ) : null}
      <div className={ui.grid}>
        {metricCards.map(card => {
          const target = metricTargets[card.key] ?? 0;
          const last = card.bucket.lastMs ?? 0;
          return (
            <div key={card.key} className={ui.card}>
              <div className={ui.cardLabel}>{card.label}</div>
              <div className={ui.cardValue}>{last.toFixed(1)} ms</div>
              <div className={ui.subtitle}>
                avg {card.bucket.avgMs.toFixed(1)} • max{' '}
                {card.bucket.maxMs.toFixed(1)} • target {target} ms
              </div>
            </div>
          );
        })}
        {metrics ? (
          <div className={ui.card}>
            <div className={ui.cardLabel}>Sockets</div>
            <div className={ui.cardValue}>{metrics.sockets.connected}</div>
            <div className={ui.subtitle}>
              Updated {new Date(metrics.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        ) : null}
      </div>
      <div className={ui.spaceSection}>
        <div className={ui.sectionTitle}>Space health</div>
        {spaceMetrics.length === 0 ? (
          <div className={`${ui.notice} ${ui.noticeInfo}`}>
            No space metrics available yet.
          </div>
        ) : (
          <div className={ui.spaceTable}>
            <div className={ui.spaceHeader}>
              <span>Space</span>
              <span>Users</span>
              <span>Vessels</span>
              <span>AI</span>
              <span>Players</span>
              <span>Updated</span>
            </div>
            {spaceMetrics.map(space => (
              <div key={space.spaceId} className={ui.spaceRow}>
                <span>{space.name}</span>
                <span>{space.connected}</span>
                <span>{space.vessels}</span>
                <span>{space.aiVessels}</span>
                <span>{space.playerVessels}</span>
                <span>{new Date(space.updatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
