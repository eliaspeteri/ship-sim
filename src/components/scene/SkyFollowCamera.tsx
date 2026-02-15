import React from 'react';
import { Sky } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';

export function SkyFollowCamera(
  props: React.ComponentProps<typeof Sky> & { enabled?: boolean },
) {
  const { camera } = useThree();
  const ref = React.useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (!props.enabled || !ref.current) return;
    ref.current.position.copy(camera.position);
  });

  return (
    <Sky
      // @ts-expect-error Sky forwards ref to an Object3D
      ref={ref}
      frustumCulled={false}
      {...props}
    />
  );
}
