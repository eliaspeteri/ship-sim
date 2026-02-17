import { promises as fs } from 'fs';
import path from 'path';

import type { EditorWorkArea } from '../features/editor/types';

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
const packsTempFile = `${packsFile}.tmp`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

let loadPromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

const runQueuedWrite = async (task: () => Promise<void>) => {
  writeQueue = writeQueue.then(task, task);
  await writeQueue;
};

const loadFromDisk = async () => {
  if (packs.size > 0) return;
  if (loadPromise) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    try {
      const raw = await fs.readFile(packsFile, 'utf8');
      const data = JSON.parse(raw) as StoredPack[];
      data.forEach(pack => packs.set(pack.id, pack));
    } catch (error) {
      const isMissingFile =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT';
      if (!isMissingFile) {
        console.warn('Failed to load editor packs', error);
      }
    }
  })();

  await loadPromise;
};

const saveToDisk = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  const data = Array.from(packs.values());
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(packsTempFile, payload, 'utf8');
  await fs.rename(packsTempFile, packsFile);
};

const seed = async () => {
  if (packs.size > 0) return;
  const now = new Date().toISOString();
  const basePack = (id: string, name: string, regionSummary: string) => {
    const slugCandidate = slugify(name);
    const slug =
      slugCandidate.length > 0 ? slugCandidate : `pack-${Date.now()}`;
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
  await runQueuedWrite(saveToDisk);
};

const ensureSeed = async () => {
  await loadFromDisk();
  await seed();
  return packs;
};

export const listPacks = async (userId?: string) => {
  const all = Array.from((await ensureSeed()).values());
  if (userId === undefined || userId.length === 0) return all;
  return all.filter(pack =>
    pack.members.some(member => member.userId === userId),
  );
};

export const getPack = async (id: string) => {
  return (await ensureSeed()).get(id) ?? null;
};

export const getPackBySlug = async (ownerId: string, slug: string) => {
  return (
    Array.from((await ensureSeed()).values()).find(
      pack => pack.ownerId === ownerId && pack.slug === slug,
    ) ?? null
  );
};

const ensureUniqueSlug = async (ownerId: string, slug: string) => {
  const existing = Array.from((await ensureSeed()).values()).filter(
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

const isDuplicateName = async (
  ownerId: string,
  name: string,
  excludeId?: string,
) => {
  const normalized = name.trim().toLowerCase();
  return Array.from((await ensureSeed()).values()).some(
    pack =>
      pack.ownerId === ownerId &&
      pack.name.trim().toLowerCase() === normalized &&
      pack.id !== excludeId,
  );
};

export const hasDuplicateName = async (
  ownerId: string,
  name: string,
  excludeId?: string,
) => isDuplicateName(ownerId, name, excludeId);

export const createPack = async (input: {
  name: string;
  description: string;
  regionSummary?: string;
  ownerId: string;
  visibility?: StoredPack['visibility'];
  submitForReview?: boolean;
}) => {
  if (await isDuplicateName(input.ownerId, input.name)) {
    return { error: 'Duplicate pack title' } as const;
  }
  const slugCandidate = slugify(input.name);
  const slugBase =
    slugCandidate.length > 0 ? slugCandidate : `pack-${Date.now()}`;
  const slug = await ensureUniqueSlug(input.ownerId, slugBase);
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
  await runQueuedWrite(saveToDisk);
  return { pack } as const;
};

export const updatePack = async (id: string, patch: Partial<StoredPack>) => {
  const pack = await getPack(id);
  if (!pack) return null;
  const updated: StoredPack = {
    ...pack,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  packs.set(id, updated);
  await runQueuedWrite(saveToDisk);
  return updated;
};

export const deletePack = async (id: string) => {
  const pack = await getPack(id);
  if (!pack) return false;
  packs.delete(id);
  await runQueuedWrite(saveToDisk);
  return true;
};

export const transitionPackStatus = async (id: string, next: PackStatus) => {
  const pack = await getPack(id);
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
