import { useFrame } from '@react-three/fiber';

import type React from 'react';

export function WaveClock({
  timeRef,
}: {
  timeRef: React.MutableRefObject<number>;
}) {
  useFrame(state => {
    timeRef.current = state.clock.elapsedTime;
  });

  return null;
}
