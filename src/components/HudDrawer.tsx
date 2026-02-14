import React from 'react';
import { HudDrawerContainer, type HudDrawerProps } from './HudDrawerContainer';

export function HudDrawer(props: HudDrawerProps): React.ReactElement {
  return <HudDrawerContainer {...props} />;
}
