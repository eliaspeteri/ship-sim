import fs from 'fs';
import path from 'path';
import { DEFAULT_HYDRO } from '../constants/vessel';
import { ShipType } from '../types/vessel.types';
import type {
  VesselCatalog,
  VesselCatalogEntry,
} from '../types/vesselCatalog.types';
import type { VesselPhysicsConfig } from '../types/physics.types';

const CATALOG_PATH = path.join(
  process.cwd(),
  'data',
  'vessels',
  'catalog.json',
);
const MODS_DIR = path.join(process.cwd(), 'data', 'vessels', 'mods');
const DEFAULT_TEMPLATE_ID = 'starter-container';

const readJsonFile = (filePath: string): unknown => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const normalizeCatalogEntries = (payload: unknown): VesselCatalogEntry[] => {
  if (Array.isArray(payload)) {
    return payload as VesselCatalogEntry[];
  }
  if (payload && typeof payload === 'object') {
    const entries = (payload as { entries?: VesselCatalogEntry[] }).entries;
    if (Array.isArray(entries)) return entries;
  }
  return [];
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

const mergePhysicsConfig = (
  base?: VesselPhysicsConfig,
  update?: VesselPhysicsConfig,
): VesselPhysicsConfig | undefined => {
  if (!base && !update) return undefined;
  const merged = {
    ...base,
    ...update,
    params: { ...(base?.params || {}), ...(update?.params || {}) },
  };
  if (!merged.model || merged.schemaVersion === undefined) return undefined;
  return merged as VesselPhysicsConfig;
};

const loadCatalogEntries = (): VesselCatalogEntry[] => {
  const basePayload = readJsonFile(CATALOG_PATH);
  const baseEntries = normalizeCatalogEntries(basePayload);
  const merged = new Map(baseEntries.map(entry => [entry.id, entry]));

  if (fs.existsSync(MODS_DIR)) {
    const files = fs
      .readdirSync(MODS_DIR)
      .filter(name => name.toLowerCase().endsWith('.json'));
    for (const file of files) {
      const payload = readJsonFile(path.join(MODS_DIR, file));
      const entries = normalizeCatalogEntries(payload);
      for (const entry of entries) {
        const existing = merged.get(entry.id);
        merged.set(entry.id, existing ? mergeEntry(existing, entry) : entry);
      }
    }
  }

  return Array.from(merged.values());
};

let cachedCatalog: VesselCatalog | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10_000;

export const getVesselCatalog = (): VesselCatalog => {
  const now = Date.now();
  if (cachedCatalog && now - cachedAt < CACHE_TTL_MS) {
    return cachedCatalog;
  }
  const entries = loadCatalogEntries();
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  cachedCatalog = { entries, byId };
  cachedAt = now;
  return cachedCatalog;
};

export const resolveVesselTemplate = (
  templateId?: string | null,
): VesselCatalogEntry => {
  const { entries, byId } = getVesselCatalog();
  if (templateId && byId.has(templateId)) {
    return byId.get(templateId)!;
  }
  return (
    byId.get(DEFAULT_TEMPLATE_ID) ||
    entries[0] || {
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
    }
  );
};

export const buildHydrodynamics = (template: VesselCatalogEntry) => ({
  ...DEFAULT_HYDRO,
  ...template.hydrodynamics,
});
