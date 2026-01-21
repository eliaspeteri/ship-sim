import { EditorWorkArea } from '../features/editor/types';

type PackStatus = 'draft' | 'submitted' | 'published';

type PackRole = 'owner' | 'editor' | 'viewer';

type PackMember = {
  userId: string;
  role: PackRole;
};

type StoredPack = {
  id: string;
  name: string;
  description: string;
  regionSummary?: string;
  visibility: 'draft' | 'published' | 'curated';
  status: PackStatus;
  updatedAt: string;
  createdAt: string;
  members: PackMember[];
  workAreas: EditorWorkArea[];
};

const packs = new Map<string, StoredPack>();

const seed = () => {
  if (packs.size > 0) return;
  const now = new Date().toISOString();
  const basePack = (id: string, name: string, regionSummary: string) => ({
    id,
    name,
    description: 'Draft pack generated for editor scaffolding.',
    regionSummary,
    visibility: 'draft' as const,
    status: 'draft' as const,
    updatedAt: now,
    createdAt: now,
    members: [{ userId: 'demo', role: 'owner' as const }],
    workAreas: [],
  });
  packs.set('pack-hampton-roads', basePack('pack-hampton-roads', 'Hampton Roads Access', 'Virginia, USA'));
  packs.set('pack-rotterdam-harbor', basePack('pack-rotterdam-harbor', 'Port of Rotterdam', 'Netherlands'));
  packs.set('pack-sf-bay', basePack('pack-sf-bay', 'San Francisco Bay', 'California, USA'));
};

const ensureSeed = () => {
  seed();
  return packs;
};

export const listPacks = () => {
  return Array.from(ensureSeed().values());
};

export const getPack = (id: string) => {
  return ensureSeed().get(id) ?? null;
};

export const createPack = (input: {
  name: string;
  description: string;
  regionSummary?: string;
  ownerId: string;
}) => {
  const id = `pack-${Date.now()}`;
  const now = new Date().toISOString();
  const pack: StoredPack = {
    id,
    name: input.name,
    description: input.description,
    regionSummary: input.regionSummary,
    visibility: 'draft',
    status: 'draft',
    updatedAt: now,
    createdAt: now,
    members: [{ userId: input.ownerId, role: 'owner' }],
    workAreas: [],
  };
  packs.set(id, pack);
  return pack;
};

export const updatePack = (id: string, patch: Partial<StoredPack>) => {
  const pack = getPack(id);
  if (!pack) return null;
  const updated: StoredPack = {
    ...pack,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  packs.set(id, updated);
  return updated;
};

export const transitionPackStatus = (id: string, next: PackStatus) => {
  const pack = getPack(id);
  if (!pack) return null;
  const allowed: Record<PackStatus, PackStatus[]> = {
    draft: ['submitted'],
    submitted: ['published'],
    published: [],
  };
  if (!allowed[pack.status].includes(next)) return null;
  return updatePack(id, { status: next, visibility: next === 'published' ? 'published' : pack.visibility });
};

export type { StoredPack, PackStatus, PackRole };
