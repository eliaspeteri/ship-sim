import { positionToXY } from '../../../lib/position';
import type {
  VesselState,
  SimpleVesselState,
} from '../../../types/vessel.types';
import { DEFAULT_SPACE_ID } from '../constants';

type OtherVesselMap = Record<string, SimpleVesselState | undefined>;

type SpaceScopedVessel = {
  id: string;
  vessel: SimpleVesselState;
};

type ProjectedVessel = SpaceScopedVessel & {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  distanceMeters: number;
  distanceNm: number;
  bearingDeg: number;
};

export function resolveActiveSpaceId(spaceId?: string | null): string {
  return spaceId || DEFAULT_SPACE_ID;
}

export function selectInSpaceVessels({
  otherVessels,
  spaceId,
  excludeVesselId,
}: {
  otherVessels: OtherVesselMap | null | undefined;
  spaceId?: string | null;
  excludeVesselId?: string | null;
}): SpaceScopedVessel[] {
  const activeSpaceId = resolveActiveSpaceId(spaceId);

  return Object.entries(otherVessels || {})
    .filter(([id, vessel]) => {
      if (!vessel) return false;
      if (excludeVesselId && id === excludeVesselId) return false;
      const vesselSpace =
        (vessel as SimpleVesselState & { spaceId?: string }).spaceId ||
        activeSpaceId;
      return vesselSpace === activeSpaceId;
    })
    .map(([id, vessel]) => ({ id, vessel: vessel as SimpleVesselState }));
}

export function projectVesselsFromOwnShip({
  ownPosition,
  vessels,
}: {
  ownPosition: Pick<VesselState['position'], 'lat' | 'lon'>;
  vessels: SpaceScopedVessel[];
}): ProjectedVessel[] {
  const ownXY = positionToXY({ lat: ownPosition.lat, lon: ownPosition.lon });

  return vessels.map(({ id, vessel }) => {
    const projected = positionToXY({
      lat: vessel.position?.lat ?? ownPosition.lat,
      lon: vessel.position?.lon ?? ownPosition.lon,
    });
    const deltaX = projected.x - ownXY.x;
    const deltaY = projected.y - ownXY.y;
    const distanceMeters = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const distanceNm = distanceMeters / 1852;
    const bearingDeg = ((Math.atan2(deltaX, deltaY) * (180 / Math.PI) + 360) %
      360) as number;

    return {
      id,
      vessel,
      x: projected.x,
      y: projected.y,
      deltaX,
      deltaY,
      distanceMeters,
      distanceNm,
      bearingDeg,
    };
  });
}

export function deriveJoinableVessels({
  otherVessels,
  maxCrew,
}: {
  otherVessels: OtherVesselMap | null | undefined;
  maxCrew: number;
}): Array<{ id: string; crewCount: number; label: string }> {
  return Object.entries(otherVessels || {})
    .filter(([, vessel]) => {
      if (!vessel) return false;
      const crewCount = vessel.crewCount ?? vessel.crewIds?.length ?? 0;
      return vessel.mode === 'player' && crewCount > 0 && crewCount < maxCrew;
    })
    .map(([id, vessel]) => {
      const crewCount = vessel?.crewCount ?? vessel?.crewIds?.length ?? 0;
      const label =
        vessel?.helm?.username || vessel?.helm?.userId || vessel?.ownerId || id;
      return { id, crewCount, label };
    })
    .sort((a, b) => a.crewCount - b.crewCount);
}

export function deriveSceneDragTargets({
  isAdmin,
  isSpectator,
  currentVesselId,
  vesselPosition,
  vessels,
}: {
  isAdmin: boolean;
  isSpectator: boolean;
  currentVesselId: string | null;
  vesselPosition: { x: number; y: number };
  vessels: SpaceScopedVessel[];
}): Array<{ id: string; x: number; y: number }> {
  if (!isAdmin || !isSpectator) return [];

  const targets: Array<{ id: string; x: number; y: number }> = [];

  if (currentVesselId) {
    targets.push({
      id: currentVesselId,
      x: vesselPosition.x,
      y: vesselPosition.y,
    });
  }

  vessels.forEach(({ id, vessel }) => {
    targets.push({
      id,
      x: vessel.position.x ?? 0,
      y: vessel.position.y ?? 0,
    });
  });

  return targets;
}

export function selectSceneVesselSnapshot({
  selectedVesselId,
  currentVesselId,
  vessel,
  otherVessels,
}: {
  selectedVesselId: string | null;
  currentVesselId: string | null;
  vessel: VesselState;
  otherVessels: OtherVesselMap | null | undefined;
}) {
  if (!selectedVesselId) return null;

  if (selectedVesselId === currentVesselId) {
    return {
      id: selectedVesselId,
      position: vessel.position,
      orientation: vessel.orientation,
      velocity: vessel.velocity,
      controls: vessel.controls,
      waterDepth: vessel.waterDepth,
      properties: vessel.properties,
    };
  }

  return (otherVessels || {})[selectedVesselId] || null;
}

export type { OtherVesselMap, SpaceScopedVessel, ProjectedVessel };
