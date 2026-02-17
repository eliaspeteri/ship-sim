import { useFrame } from '@react-three/fiber';
import React from 'react';

import { socketManager } from '../../networking/socket';

export function RendererPerfMonitor({ enabled }: { enabled: boolean }) {
  const frameCounter = React.useRef(0);
  const totalMs = React.useRef(0);
  const maxMs = React.useRef(0);
  const lastReportAt = React.useRef(0);
  const warnAvg = 18;
  const warnMax = 40;
  const reportInterval = 5000;

  useFrame((_, delta) => {
    if (!enabled) return;

    const now = performance.now();
    const ms = delta * 1000;
    frameCounter.current += 1;
    totalMs.current += ms;
    maxMs.current = Math.max(maxMs.current, ms);

    if (now - lastReportAt.current > reportInterval) {
      const avgMs =
        frameCounter.current > 0 ? totalMs.current / frameCounter.current : 0;

      if (avgMs > warnAvg || maxMs.current > warnMax) {
        socketManager.sendClientLog({
          level: 'warn',
          source: 'renderer',
          message: 'Renderer frame budget exceeded',
          meta: { avgMs, maxMs: maxMs.current },
        });
      }

      lastReportAt.current = now;
      frameCounter.current = 0;
      totalMs.current = 0;
      maxMs.current = 0;
    }
  });

  return null;
}
