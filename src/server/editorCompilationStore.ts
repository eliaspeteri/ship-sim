type TileKey = {
  z: number;
  x: number;
  y: number;
};

type StoredArtifact = {
  packId: string;
  tile: TileKey;
  layerId: string;
  lod: number;
  bytesBase64: string;
  storedAt: string;
};

const packArtifacts = new Map<string, Map<string, StoredArtifact>>();

const artifactKey = (tile: TileKey, layerId: string, lod: number) =>
  `${tile.z}/${tile.x}/${tile.y}:${layerId}:${lod}`;

export const storeArtifacts = (
  packId: string,
  artifacts: Omit<StoredArtifact, 'packId' | 'storedAt'>[],
) => {
  const storedAt = new Date().toISOString();
  const packMap = packArtifacts.get(packId) ?? new Map();
  artifacts.forEach(artifact => {
    const key = artifactKey(artifact.tile, artifact.layerId, artifact.lod);
    packMap.set(key, { ...artifact, packId, storedAt });
  });
  packArtifacts.set(packId, packMap);
  return storedAt;
};

export const getOverlayChunks = (params: {
  packId: string;
  tile: TileKey;
  layerIds: string[];
  lod: number;
}) => {
  const packMap = packArtifacts.get(params.packId);
  if (!packMap) return [] as StoredArtifact[];
  return params.layerIds
    .map(layerId => {
      const key = artifactKey(params.tile, layerId, params.lod);
      return packMap.get(key);
    })
    .filter((item): item is StoredArtifact => Boolean(item));
};
