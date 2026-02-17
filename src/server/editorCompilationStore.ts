import { promises as fs } from 'fs';
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
const artifactsTempFile = `${artifactsFile}.tmp`;

export const ARTIFACT_LIMITS = {
  maxPerPack: 2000,
  maxTotal: 10000,
};

const artifactKey = (tile: TileKey, layerId: string, lod: number) =>
  `${tile.z}/${tile.x}/${tile.y}:${layerId}:${lod}`;

let loadPromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

const runQueuedWrite = async (task: () => Promise<void>) => {
  writeQueue = writeQueue.then(task, task);
  await writeQueue;
};

const loadFromDisk = async () => {
  if (packArtifacts.size > 0) return;
  if (loadPromise) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    try {
      const raw = await fs.readFile(artifactsFile, 'utf8');
      const data = JSON.parse(raw) as StoredArtifact[];
      data.forEach(artifact => {
        const packMap =
          packArtifacts.get(artifact.packId) ??
          new Map<string, StoredArtifact>();
        packMap.set(
          artifactKey(artifact.tile, artifact.layerId, artifact.lod),
          artifact,
        );
        packArtifacts.set(artifact.packId, packMap);
      });
    } catch (error) {
      const isMissingFile =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT';
      if (!isMissingFile) {
        console.warn('Failed to load editor artifacts', error);
      }
    }
  })();

  await loadPromise;
};

const saveToDisk = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  const data: StoredArtifact[] = [];
  packArtifacts.forEach(packMap => {
    packMap.forEach(artifact => data.push(artifact));
  });
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(artifactsTempFile, payload, 'utf8');
  await fs.rename(artifactsTempFile, artifactsFile);
};

const trimPack = (packId: string, packMap: Map<string, StoredArtifact>) => {
  if (packMap.size <= ARTIFACT_LIMITS.maxPerPack) return;
  const entries = Array.from(packMap.entries()).sort((a, b) =>
    a[1].storedAt.localeCompare(b[1].storedAt),
  );
  const excess = packMap.size - ARTIFACT_LIMITS.maxPerPack;
  for (let i = 0; i < excess; i += 1) {
    packMap.delete(entries[i][0]);
  }
  if (packMap.size === 0) {
    packArtifacts.delete(packId);
  }
};

const trimGlobal = () => {
  const allEntries: Array<{ packId: string; key: string; storedAt: string }> =
    [];
  packArtifacts.forEach((packMap, packId) => {
    packMap.forEach((artifact, key) => {
      allEntries.push({ packId, key, storedAt: artifact.storedAt });
    });
  });
  if (allEntries.length <= ARTIFACT_LIMITS.maxTotal) return;
  allEntries.sort((a, b) => a.storedAt.localeCompare(b.storedAt));
  const excess = allEntries.length - ARTIFACT_LIMITS.maxTotal;
  for (let i = 0; i < excess; i += 1) {
    const entry = allEntries[i];
    const packMap = packArtifacts.get(entry.packId);
    if (!packMap) continue;
    packMap.delete(entry.key);
    if (packMap.size === 0) {
      packArtifacts.delete(entry.packId);
    }
  }
};

const enforceLimits = () => {
  packArtifacts.forEach((packMap, packId) => {
    trimPack(packId, packMap);
  });
  trimGlobal();
};

export const storeArtifacts = async (
  packId: string,
  artifacts: Omit<StoredArtifact, 'packId' | 'storedAt'>[],
) => {
  await loadFromDisk();
  const storedAt = new Date().toISOString();

  await runQueuedWrite(async () => {
    const packMap =
      packArtifacts.get(packId) ?? new Map<string, StoredArtifact>();
    artifacts.forEach(artifact => {
      const key = artifactKey(artifact.tile, artifact.layerId, artifact.lod);
      packMap.set(key, { ...artifact, packId, storedAt });
    });
    packArtifacts.set(packId, packMap);
    enforceLimits();
    await saveToDisk();
  });

  return storedAt;
};

export const getOverlayChunks = async (params: {
  packId: string;
  tile: TileKey;
  layerIds: string[];
  lod: number;
}) => {
  await loadFromDisk();
  const packMap = packArtifacts.get(params.packId);
  if (!packMap) return [] as StoredArtifact[];
  return params.layerIds
    .map(layerId => {
      const key = artifactKey(params.tile, layerId, params.lod);
      return packMap.get(key);
    })
    .filter((item): item is StoredArtifact => Boolean(item));
};
