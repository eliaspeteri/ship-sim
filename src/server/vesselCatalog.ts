import { promises as fs } from 'fs';
import path from 'path';

import { DEFAULT_HYDRO } from '../constants/vessel';
import { ShipType } from '../types/vessel.types';

import type { VesselPhysicsConfig } from '../types/physics.types';
import type {
  VesselCatalog,
  VesselCatalogEntry,
} from '../types/vesselCatalog.types';

const CATALOG_PATH = path.join(
  process.cwd(),
  'data',
  'vessels',
  'catalog.json',
);
const MODS_DIR = path.join(process.cwd(), 'data', 'vessels', 'mods');
const DEFAULT_TEMPLATE_ID = 'starter-container';
const CACHE_TTL_MS = 10_000;

const FALLBACK_ENTRY: VesselCatalogEntry = {
  id: DEFAULT_TEMPLATE_ID,
  name: 'Default Vessel',
  shipType: ShipType.DEFAULT,
  modelPath: null,
  physics: {
    model: 'displacement',
    schemaVersion: 1,
  },
  properties: {
    mass: 1_000_000,
    length: 120,
    beam: 20,
    draft: 6,
    blockCoefficient: 0.8,
    maxSpeed: 20,
  },
  hydrodynamics: {},
  commerce: {},
  tags: [],
};

const makeCatalog = (entries: VesselCatalogEntry[]): VesselCatalog => ({
  entries,
  byId: new Map(entries.map(entry => [entry.id, entry])),
});

let cachedCatalog: VesselCatalog = makeCatalog([FALLBACK_ENTRY]);
let cachedAt = 0;
let refreshPromise: Promise<void> | null = null;

const readJsonFile = async (filePath: string): Promise<unknown> => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const normalizeCatalogEntries = (payload: unknown): VesselCatalogEntry[] => {
  if (Array.isArray(payload)) {
    return payload as VesselCatalogEntry[];
  }
  if (payload !== null && typeof payload === 'object') {
    const entries = (payload as { entries?: VesselCatalogEntry[] }).entries;
    if (Array.isArray(entries)) return entries;
  }
  return [];
};

const mergePhysicsConfig = (
  base?: VesselPhysicsConfig,
  update?: VesselPhysicsConfig,
): VesselPhysicsConfig | undefined => {
  if (base === undefined && update === undefined) return undefined;
  const merged = {
    ...base,
    ...update,
    params: { ...(base?.params ?? {}), ...(update?.params ?? {}) },
  };
  if (merged.model === undefined || merged.schemaVersion === undefined)
    return undefined;
  return merged as VesselPhysicsConfig;
};

const mergeEntry = (
  base: VesselCatalogEntry,
  update: VesselCatalogEntry,
): VesselCatalogEntry => ({
  ...base,
  ...update,
  properties: { ...base.properties, ...update.properties },
  hydrodynamics: { ...base.hydrodynamics, ...update.hydrodynamics },
  physics: mergePhysicsConfig(base.physics, update.physics),
  commerce: { ...base.commerce, ...update.commerce },
  tags: update.tags ?? base.tags,
});

const loadCatalogEntries = async (): Promise<VesselCatalogEntry[]> => {
  const basePayload = await readJsonFile(CATALOG_PATH);
  const baseEntries = normalizeCatalogEntries(basePayload);
  const merged = new Map(baseEntries.map(entry => [entry.id, entry]));

  try {
    const files = (await fs.readdir(MODS_DIR)).filter(name =>
      name.toLowerCase().endsWith('.json'),
    );
    for (const file of files) {
      const payload = await readJsonFile(path.join(MODS_DIR, file));
      const entries = normalizeCatalogEntries(payload);
      for (const entry of entries) {
        const existing = merged.get(entry.id);
        merged.set(entry.id, existing ? mergeEntry(existing, entry) : entry);
      }
    }
  } catch (error) {
    const isMissingDir =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT';
    if (!isMissingDir) throw error;
  }

  return Array.from(merged.values());
};

const refreshCatalog = async () => {
  const entries = await loadCatalogEntries();
  if (entries.length > 0) {
    cachedCatalog = makeCatalog(entries);
    cachedAt = Date.now();
  }
};

const scheduleRefresh = () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = refreshCatalog()
    .catch(error => {
      console.warn('Failed to refresh vessel catalog', error);
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
};

export const warmVesselCatalog = async (): Promise<void> => {
  await scheduleRefresh();
};

export const getVesselCatalog = (): VesselCatalog => {
  const now = Date.now();
  if (cachedAt === 0) {
    void scheduleRefresh();
    return cachedCatalog;
  }
  if (now - cachedAt >= CACHE_TTL_MS) {
    void scheduleRefresh();
  }
  return cachedCatalog;
};

export const resolveVesselTemplate = (
  templateId?: string | null,
): VesselCatalogEntry => {
  const { entries, byId } = getVesselCatalog();
  if (templateId !== null && templateId !== undefined && byId.has(templateId)) {
    return byId.get(templateId)!;
  }
  return byId.get(DEFAULT_TEMPLATE_ID) ?? entries[0];
};

export const buildHydrodynamics = (template: VesselCatalogEntry) => ({
  ...DEFAULT_HYDRO,
  ...template.hydrodynamics,
});
