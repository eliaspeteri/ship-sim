import React from 'react';

import { EcdisDisplay } from '../../navigation/ecdis/EcdisDisplay';

export function HudEcdisPanel({
  shipPosition,
  heading,
}: {
  shipPosition: { lat: number; lon: number; z?: number };
  heading: number | undefined;
}) {
  const normalizedPosition = { ...shipPosition, z: shipPosition.z ?? 0 };
  return <EcdisDisplay shipPosition={normalizedPosition} heading={heading} />;
}
