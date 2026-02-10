import fs from 'fs';

jest.mock('fs', () => {
  const mocked = {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
  return {
    __esModule: true,
    default: mocked,
    ...mocked,
  };
});

type MockedFs = {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
  mkdirSync: jest.Mock;
  writeFileSync: jest.Mock;
};
let mockedFs = fs as unknown as MockedFs;

const loadStore = async () => {
  return import('../../../src/server/editorPacksStore');
};

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
    mockedFs.existsSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    mockedFs.existsSync.mockReturnValue(false);
  });

  it('seeds default packs and filters by user', async () => {
    const { listPacks } = await loadStore();

    const demoPacks = listPacks('demo');
    const unknownUserPacks = listPacks('nobody');
    const allPacks = listPacks();

    expect(demoPacks).toHaveLength(3);
    expect(unknownUserPacks).toEqual([]);
    expect(allPacks).toHaveLength(3);
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('loads packs from disk and resolves by id and slug', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
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

    const ownerPacks = listPacks('owner-1');

    expect(ownerPacks).toHaveLength(1);
    expect(getPack('pack-1')).toEqual(
      expect.objectContaining({ id: 'pack-1' }),
    );
    expect(getPackBySlug('owner-2', 'other-pack')).toEqual(
      expect.objectContaining({ id: 'pack-2' }),
    );
  });

  it('rejects duplicate names for a single owner', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify([buildPack({ name: 'My Pack', ownerId: 'owner-1' })]),
    );
    const { createPack, hasDuplicateName } = await loadStore();

    const duplicate = createPack({
      ownerId: 'owner-1',
      name: '  my pack  ',
      description: 'Desc',
    });

    expect(hasDuplicateName('owner-1', 'MY PACK')).toBe(true);
    expect(hasDuplicateName('owner-1', 'MY PACK', 'pack-1')).toBe(false);
    expect(duplicate).toEqual({ error: 'Duplicate pack title' });
  });

  it('creates unique slugs, updates, transitions and deletes packs', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
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

    const created = createPack({
      ownerId: 'owner-1',
      name: 'My-Pack',
      description: 'Second one',
    });
    expect(created.pack).toBeDefined();
    const createdPack = created.pack!;
    expect(createdPack.slug).toBe('my-pack-2');
    expect(createdPack.id).toBe('pack-123456789');

    const draftToSubmitted = transitionPackStatus(createdPack.id, 'submitted');
    expect(draftToSubmitted).toEqual(
      expect.objectContaining({ status: 'submitted' }),
    );
    const submittedToPublished = transitionPackStatus(
      createdPack.id,
      'published',
    );
    expect(submittedToPublished).toEqual(
      expect.objectContaining({ status: 'published', visibility: 'published' }),
    );
    expect(transitionPackStatus(createdPack.id, 'draft')).toBeNull();

    const updated = updatePack(createdPack.id, {
      description: 'Updated description',
    });
    expect(updated).toEqual(
      expect.objectContaining({ description: 'Updated description' }),
    );
    expect(getPack(createdPack.id)).toEqual(
      expect.objectContaining({ id: createdPack.id }),
    );

    expect(deletePack(createdPack.id)).toBe(true);
    expect(deletePack(createdPack.id)).toBe(false);

    dateNowSpy.mockRestore();
  });

  it('falls back to seed data when disk payload is malformed', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('{not-json');
    const { listPacks } = await loadStore();

    const packs = listPacks('demo');

    expect(packs).toHaveLength(3);
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('uses slug fallback when name slugifies to empty and handles missing ids', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify([]));
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(2222);
    const { createPack, deletePack, transitionPackStatus, updatePack } =
      await loadStore();

    const created = createPack({
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

    expect(updatePack('missing-pack', { name: 'Nope' } as any)).toBeNull();
    expect(deletePack('missing-pack')).toBe(false);
    expect(transitionPackStatus('missing-pack', 'submitted')).toBeNull();

    dateNowSpy.mockRestore();
  });
});
