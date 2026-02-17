import React from 'react';

import {
  courseFromWorldVelocity,
  ensurePosition,
  speedFromWorldVelocity,
  worldVelocityFromBody,
} from '../../lib/position';
import { socketManager } from '../../networking/socket';
import VesselCallout from '../VesselCallout';

type SelectedSnapshot = {
  mode?: string;
  desiredMode?: string;
  crewCount?: number;
  crewIds?: string[];
  properties?: {
    name?: string;
    length?: number;
    beam?: number;
    draft?: number;
  };
  position: {
    lat?: number;
    lon?: number;
    x?: number;
    y?: number;
    z?: number;
  };
  orientation?: {
    heading?: number;
  };
  velocity?: {
    surge?: number;
    sway?: number;
  };
};

export function AdminVesselOverlay({
  isSpectator,
  isAdmin,
  selectedVesselId,
  selectedSnapshot,
  currentVesselId,
  crewCount,
  focusRef,
  onDeselect,
}: {
  isSpectator: boolean;
  isAdmin: boolean;
  selectedVesselId: string | null;
  selectedSnapshot: SelectedSnapshot | null;
  currentVesselId: string | null;
  crewCount: number;
  focusRef: React.MutableRefObject<{ x: number; y: number }>;
  onDeselect: () => void;
}) {
  const [calloutOffset, setCalloutOffset] = React.useState({ x: 24, y: -24 });

  React.useEffect(() => {
    if (selectedVesselId) {
      setCalloutOffset({ x: 24, y: -24 });
    }
  }, [selectedVesselId]);

  const calloutData = React.useMemo(() => {
    if (!selectedSnapshot || !selectedVesselId) return null;

    const position = ensurePosition(selectedSnapshot.position);
    const heading = selectedSnapshot.orientation?.heading ?? 0;
    const velocity = selectedSnapshot.velocity || { surge: 0, sway: 0 };
    const worldVelocity = worldVelocityFromBody(heading, velocity);
    const speedKts = speedFromWorldVelocity(worldVelocity) * 1.94384;
    const course = courseFromWorldVelocity(worldVelocity);
    const headingDeg = ((heading * 180) / Math.PI + 360) % 360;
    const depth = Number.isFinite(position.z) ? Math.abs(position.z) : 0;

    const length = selectedSnapshot.properties?.length;
    const beam = selectedSnapshot.properties?.beam;
    const draft = selectedSnapshot.properties?.draft;

    const resolvedCrewCount =
      selectedSnapshot.crewCount ??
      selectedSnapshot.crewIds?.length ??
      (selectedVesselId === currentVesselId ? crewCount : 0);

    const rows = [
      { label: 'Speed', value: `${speedKts.toFixed(1)} kts` },
      { label: 'COG', value: `${course.toFixed(0)} deg` },
      { label: 'Heading', value: `${headingDeg.toFixed(0)} deg` },
      {
        label: 'Lat',
        value: Number.isFinite(position.lat) ? position.lat.toFixed(5) : 'n/a',
      },
      {
        label: 'Lon',
        value: Number.isFinite(position.lon) ? position.lon.toFixed(5) : 'n/a',
      },
      { label: 'Depth', value: `${depth.toFixed(1)} m` },
      {
        label: 'Length',
        value: Number.isFinite(length) ? `${length?.toFixed(1)} m` : 'n/a',
      },
      {
        label: 'Beam',
        value: Number.isFinite(beam) ? `${beam?.toFixed(1)} m` : 'n/a',
      },
      {
        label: 'Draft',
        value: Number.isFinite(draft) ? `${draft?.toFixed(1)} m` : 'n/a',
      },
      { label: 'Crew', value: resolvedCrewCount.toString() },
      {
        label: 'Mode',
        value: selectedSnapshot.mode || selectedSnapshot.desiredMode || 'n/a',
      },
    ];

    return {
      position: {
        x: position.x ?? 0,
        y: (position.z ?? 0) + 6,
        z: position.y ?? 0,
      },
      rows,
    };
  }, [crewCount, currentVesselId, selectedSnapshot, selectedVesselId]);

  const calloutTitle = React.useMemo(() => {
    if (!selectedSnapshot || !selectedVesselId) return '';

    const name = selectedSnapshot.properties?.name;
    const displayId =
      selectedVesselId.length > 10
        ? `${selectedVesselId.slice(0, 10)}...`
        : selectedVesselId;

    return name ? name : `Vessel ${displayId}`;
  }, [selectedSnapshot, selectedVesselId]);

  const calloutActions = React.useMemo(() => {
    if (!isAdmin || !selectedVesselId) return [];

    return [
      {
        label: 'Stop',
        onClick: () => socketManager.sendAdminVesselStop(selectedVesselId),
        variant: 'ghost' as const,
      },
      {
        label: 'Move to view',
        onClick: () =>
          socketManager.sendAdminVesselMove(selectedVesselId, {
            x: focusRef.current.x,
            y: focusRef.current.y,
          }),
        variant: 'ghost' as const,
      },
      {
        label: 'Force AI',
        onClick: () =>
          socketManager.sendAdminVesselMode(selectedVesselId, 'ai'),
        variant: 'ghost' as const,
      },
      {
        label: 'Force player',
        onClick: () =>
          socketManager.sendAdminVesselMode(selectedVesselId, 'player'),
        variant: 'ghost' as const,
      },
      {
        label: 'Remove',
        onClick: () => {
          socketManager.sendAdminVesselRemove(selectedVesselId);
          onDeselect();
        },
        variant: 'danger' as const,
      },
    ];
  }, [focusRef, isAdmin, onDeselect, selectedVesselId]);

  if (!isSpectator || !selectedVesselId || !calloutData) {
    return null;
  }

  return (
    <VesselCallout
      vesselId={selectedVesselId}
      title={calloutTitle}
      position={calloutData.position}
      rows={calloutData.rows}
      offset={calloutOffset}
      onOffsetChange={setCalloutOffset}
      onClose={onDeselect}
      actions={calloutActions}
    />
  );
}
