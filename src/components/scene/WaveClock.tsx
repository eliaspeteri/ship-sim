import React from 'react';
import { useFrame } from '@react-three/fiber';

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
