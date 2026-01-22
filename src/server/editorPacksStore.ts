import fs from 'fs';
import path from 'path';
import { EditorWorkArea } from '../features/editor/types';

type PackStatus = 'draft' | 'submitted' | 'published';

type PackRole = 'owner' | 'editor' | 'viewer';

type PackMember = {
  userId: string;
  role: PackRole;
};

type StoredPack = {
  id: string;
  slug: string;
  ownerId: string;
  name: string;
  description: string;
  regionSummary?: string;
  visibility: 'draft' | 'published' | 'curated';
  status: PackStatus;
  submitForReview?: boolean;
  updatedAt: string;
  createdAt: string;
  members: PackMember[];
  workAreas: EditorWorkArea[];
};

const packs = new Map<string, StoredPack>();
const dataDir = path.join(process.cwd(), 'data');
const packsFile = path.join(dataDir, 'editor-packs.json');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const loadFromDisk = () => {
  if (packs.size > 0) return;
  if (!fs.existsSync(packsFile)) return;
  try {
    const raw = fs.readFileSync(packsFile, 'utf8');
    const data = JSON.parse(raw) as StoredPack[];
    data.forEach(pack => packs.set(pack.id, pack));
  } catch (error) {
    console.warn('Failed to load editor packs', error);
  }
};

const saveToDisk = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  const data = Array.from(packs.values());
  fs.writeFileSync(packsFile, JSON.stringify(data, null, 2));
};

const seed = () => {
  if (packs.size > 0) return;
  const now = new Date().toISOString();
  const basePack = (id: string, name: string, regionSummary: string) => {
    const slug = slugify(name) || `pack-${Date.now()}`;
    return {
      id,
      slug,
      ownerId: 'demo',
      name,
      description: 'Draft pack generated for editor scaffolding.',
      regionSummary,
      visibility: 'draft' as const,
      status: 'draft' as const,
      updatedAt: now,
      createdAt: now,
      members: [{ userId: 'demo', role: 'owner' as const }],
      workAreas: [],
    };
  };
  packs.set(
    'pack-hampton-roads',
    basePack('pack-hampton-roads', 'Hampton Roads Access', 'Virginia, USA'),
  );
  packs.set(
    'pack-rotterdam-harbor',
    basePack('pack-rotterdam-harbor', 'Port of Rotterdam', 'Netherlands'),
  );
  packs.set(
    'pack-sf-bay',
    basePack('pack-sf-bay', 'San Francisco Bay', 'California, USA'),
  );
  saveToDisk();
};

const ensureSeed = () => {
  loadFromDisk();
  seed();
  return packs;
};

export const listPacks = (userId?: string) => {
  const all = Array.from(ensureSeed().values());
  if (!userId) return all;
  return all.filter(pack =>
    pack.members.some(member => member.userId === userId),
  );
};

export const getPack = (id: string) => {
  return ensureSeed().get(id) ?? null;
};

export const getPackBySlug = (ownerId: string, slug: string) => {
  return (
    Array.from(ensureSeed().values()).find(
      pack => pack.ownerId === ownerId && pack.slug === slug,
    ) ?? null
  );
};

const ensureUniqueSlug = (ownerId: string, slug: string) => {
  const existing = Array.from(ensureSeed().values()).filter(
    pack => pack.ownerId === ownerId,
  );
  let next = slug;
  let suffix = 2;
  while (existing.some(pack => pack.slug === next)) {
    next = `${slug}-${suffix}`;
    suffix += 1;
  }
  return next;
};

const isDuplicateName = (ownerId: string, name: string, excludeId?: string) => {
  const normalized = name.trim().toLowerCase();
  return Array.from(ensureSeed().values()).some(
    pack =>
      pack.ownerId === ownerId &&
      pack.name.trim().toLowerCase() === normalized &&
      pack.id !== excludeId,
  );
};

export const hasDuplicateName = (
  ownerId: string,
  name: string,
  excludeId?: string,
) => isDuplicateName(ownerId, name, excludeId);

export const createPack = (input: {
  name: string;
  description: string;
  regionSummary?: string;
  ownerId: string;
  visibility?: StoredPack['visibility'];
  submitForReview?: boolean;
}) => {
  if (isDuplicateName(input.ownerId, input.name)) {
    return { error: 'Duplicate pack title' } as const;
  }
  const slugBase = slugify(input.name) || `pack-${Date.now()}`;
  const slug = ensureUniqueSlug(input.ownerId, slugBase);
  const id = `pack-${Date.now()}`;
  const now = new Date().toISOString();
  const pack: StoredPack = {
    id,
    slug,
    ownerId: input.ownerId,
    name: input.name,
    description: input.description,
    regionSummary: input.regionSummary,
    visibility: input.visibility ?? 'draft',
    status: 'draft',
    submitForReview: input.submitForReview ?? false,
    updatedAt: now,
    createdAt: now,
    members: [{ userId: input.ownerId, role: 'owner' }],
    workAreas: [],
  };
  packs.set(id, pack);
  saveToDisk();
  return { pack } as const;
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
  saveToDisk();
  return updated;
};

export const deletePack = (id: string) => {
  const pack = getPack(id);
  if (!pack) return false;
  packs.delete(id);
  saveToDisk();
  return true;
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
  return updatePack(id, {
    status: next,
    visibility: next === 'published' ? 'published' : pack.visibility,
  });
};

export type { StoredPack, PackStatus, PackRole };
