import fs from 'fs';

jest.mock('fs', () => {
  const promises = {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
  };
  return {
    __esModule: true,
    default: { promises },
    promises,
  };
});

type MockedFs = {
  promises: {
    readFile: jest.Mock;
    mkdir: jest.Mock;
    writeFile: jest.Mock;
    rename: jest.Mock;
  };
};
let mockedFs = fs as unknown as MockedFs;

const loadStore = async () => import('../../../src/server/editorPacksStore');

const buildPack = (overrides: Record<string, unknown> = {}) => ({
  id: 'pack-1',
  slug: 'starter-pack',
  ownerId: 'owner-1',
  name: 'Starter Pack',
  description: 'Demo',
  regionSummary: 'Somewhere',
  visibility: 'draft',
  status: 'draft',
  submitForReview: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  members: [{ userId: 'owner-1', role: 'owner' }],
  workAreas: [],
  ...overrides,
});

describe('editorPacksStore', () => {
  beforeEach(() => {
    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.promises.readFile.mockReset();
    mockedFs.promises.mkdir.mockReset();
    mockedFs.promises.writeFile.mockReset();
    mockedFs.promises.rename.mockReset();
    mockedFs.promises.readFile.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );
    mockedFs.promises.mkdir.mockResolvedValue(undefined);
    mockedFs.promises.writeFile.mockResolvedValue(undefined);
    mockedFs.promises.rename.mockResolvedValue(undefined);
  });

  it('seeds default packs and filters by user', async () => {
    const { listPacks } = await loadStore();

    const demoPacks = await listPacks('demo');
    const unknownUserPacks = await listPacks('nobody');
    const allPacks = await listPacks();

    expect(demoPacks).toHaveLength(3);
    expect(unknownUserPacks).toEqual([]);
    expect(allPacks).toHaveLength(3);
    expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
  });

  it('loads packs from disk and resolves by id and slug', async () => {
    mockedFs.promises.readFile.mockResolvedValue(
      JSON.stringify([
        buildPack(),
        buildPack({
          id: 'pack-2',
          slug: 'other-pack',
          ownerId: 'owner-2',
          name: 'Other',
          members: [{ userId: 'owner-2', role: 'owner' }],
        }),
      ]),
    );
    const { getPack, getPackBySlug, listPacks } = await loadStore();

    const ownerPacks = await listPacks('owner-1');

    expect(ownerPacks).toHaveLength(1);
    expect(await getPack('pack-1')).toEqual(
      expect.objectContaining({ id: 'pack-1' }),
    );
    expect(await getPackBySlug('owner-2', 'other-pack')).toEqual(
      expect.objectContaining({ id: 'pack-2' }),
    );
  });

  it('rejects duplicate names for a single owner', async () => {
    mockedFs.promises.readFile.mockResolvedValue(
      JSON.stringify([buildPack({ name: 'My Pack', ownerId: 'owner-1' })]),
    );
    const { createPack, hasDuplicateName } = await loadStore();

    const duplicate = await createPack({
      ownerId: 'owner-1',
      name: '  my pack  ',
      description: 'Desc',
    });

    expect(await hasDuplicateName('owner-1', 'MY PACK')).toBe(true);
    expect(await hasDuplicateName('owner-1', 'MY PACK', 'pack-1')).toBe(false);
    expect(duplicate).toEqual({ error: 'Duplicate pack title' });
  });

  it('creates unique slugs, updates, transitions and deletes packs', async () => {
    mockedFs.promises.readFile.mockResolvedValue(
      JSON.stringify([
        buildPack({
          id: 'pack-10',
          slug: 'my-pack',
          ownerId: 'owner-1',
          name: 'My Pack',
        }),
      ]),
    );
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456789);
    const {
      createPack,
      deletePack,
      getPack,
      transitionPackStatus,
      updatePack,
    } = await loadStore();

    const created = await createPack({
      ownerId: 'owner-1',
      name: 'My-Pack',
      description: 'Second one',
    });
    expect(created.pack).toBeDefined();
    const createdPack = created.pack!;
    expect(createdPack.slug).toBe('my-pack-2');
    expect(createdPack.id).toBe('pack-123456789');

    const draftToSubmitted = await transitionPackStatus(
      createdPack.id,
      'submitted',
    );
    expect(draftToSubmitted).toEqual(
      expect.objectContaining({ status: 'submitted' }),
    );
    const submittedToPublished = await transitionPackStatus(
      createdPack.id,
      'published',
    );
    expect(submittedToPublished).toEqual(
      expect.objectContaining({ status: 'published', visibility: 'published' }),
    );
    expect(await transitionPackStatus(createdPack.id, 'draft')).toBeNull();

    const updated = await updatePack(createdPack.id, {
      description: 'Updated description',
    });
    expect(updated).toEqual(
      expect.objectContaining({ description: 'Updated description' }),
    );
    expect(await getPack(createdPack.id)).toEqual(
      expect.objectContaining({ id: createdPack.id }),
    );

    expect(await deletePack(createdPack.id)).toBe(true);
    expect(await deletePack(createdPack.id)).toBe(false);

    dateNowSpy.mockRestore();
  });

  it('falls back to seed data when disk payload is malformed', async () => {
    mockedFs.promises.readFile.mockResolvedValue('{not-json');
    const { listPacks } = await loadStore();

    const packs = await listPacks('demo');

    expect(packs).toHaveLength(3);
    expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
  });

  it('uses slug fallback when name slugifies to empty and handles missing ids', async () => {
    mockedFs.promises.readFile.mockResolvedValue(JSON.stringify([]));
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(2222);
    const { createPack, deletePack, transitionPackStatus, updatePack } =
      await loadStore();

    const created = await createPack({
      ownerId: 'owner-x',
      name: '!!!',
      description: 'No slug chars',
    });
    expect(created).toEqual(
      expect.objectContaining({
        pack: expect.objectContaining({
          id: 'pack-2222',
          slug: 'pack-2222',
        }),
      }),
    );

    expect(
      await updatePack('missing-pack', { name: 'Nope' } as Parameters<
        typeof updatePack
      >[1]),
    ).toBeNull();
    expect(await deletePack('missing-pack')).toBe(false);
    expect(await transitionPackStatus('missing-pack', 'submitted')).toBeNull();

    dateNowSpy.mockRestore();
  });
});
