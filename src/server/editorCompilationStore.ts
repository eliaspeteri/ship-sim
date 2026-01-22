import fs from 'fs';
import path from 'path';

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
const dataDir = path.join(process.cwd(), 'data');
const artifactsFile = path.join(dataDir, 'editor-artifacts.json');

const artifactKey = (tile: TileKey, layerId: string, lod: number) =>
  `${tile.z}/${tile.x}/${tile.y}:${layerId}:${lod}`;

const loadFromDisk = () => {
  if (packArtifacts.size > 0) return;
  if (!fs.existsSync(artifactsFile)) return;
  try {
    const raw = fs.readFileSync(artifactsFile, 'utf8');
    const data = JSON.parse(raw) as StoredArtifact[];
    data.forEach(artifact => {
      const packMap = packArtifacts.get(artifact.packId) ?? new Map();
      packMap.set(
        artifactKey(artifact.tile, artifact.layerId, artifact.lod),
        artifact,
      );
      packArtifacts.set(artifact.packId, packMap);
    });
  } catch (error) {
    console.warn('Failed to load editor artifacts', error);
  }
};

const saveToDisk = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  const data: StoredArtifact[] = [];
  packArtifacts.forEach(packMap => {
    packMap.forEach(artifact => data.push(artifact));
  });
  fs.writeFileSync(artifactsFile, JSON.stringify(data, null, 2));
};

export const storeArtifacts = (
  packId: string,
  artifacts: Omit<StoredArtifact, 'packId' | 'storedAt'>[],
) => {
  loadFromDisk();
  const storedAt = new Date().toISOString();
  const packMap = packArtifacts.get(packId) ?? new Map();
  artifacts.forEach(artifact => {
    const key = artifactKey(artifact.tile, artifact.layerId, artifact.lod);
    packMap.set(key, { ...artifact, packId, storedAt });
  });
  packArtifacts.set(packId, packMap);
  saveToDisk();
  return storedAt;
};

export const getOverlayChunks = (params: {
  packId: string;
  tile: TileKey;
  layerIds: string[];
  lod: number;
}) => {
  loadFromDisk();
  const packMap = packArtifacts.get(params.packId);
  if (!packMap) return [] as StoredArtifact[];
  return params.layerIds
    .map(layerId => {
      const key = artifactKey(params.tile, layerId, params.lod);
      return packMap.get(key);
    })
    .filter((item): item is StoredArtifact => Boolean(item));
};
