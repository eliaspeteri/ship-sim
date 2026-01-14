import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename);

const { serverMetrics, updateSpaceMetrics } = jiti(
  '../../src/server/metrics.ts',
);

describe('metrics', () => {
  it('updates space metrics map', () => {
    const now = Date.now();
    updateSpaceMetrics([
      {
        spaceId: 'global',
        name: 'Global Ocean',
        connected: 2,
        vessels: 3,
        aiVessels: 1,
        playerVessels: 2,
        lastBroadcastAt: now,
        updatedAt: now,
      },
    ]);

    assert.equal(serverMetrics.spaces.global.name, 'Global Ocean');
    assert.equal(serverMetrics.spaces.global.connected, 2);
    assert.equal(serverMetrics.spaces.global.vessels, 3);
  });
});
