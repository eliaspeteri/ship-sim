import fs from 'fs';
import { DEFAULT_HYDRO } from '../../../src/constants/vessel';
import { ShipType } from '../../../src/types/vessel.types';

jest.mock('fs', () => {
  const mocked = {
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
  };
  return {
    __esModule: true,
    default: mocked,
    ...mocked,
  };
});

type MockedFs = {
  existsSync: jest.Mock;
  readdirSync: jest.Mock;
  readFileSync: jest.Mock;
};
let mockedFs = fs as unknown as MockedFs;

const loadCatalog = async () => {
  return import('../../../src/server/vesselCatalog');
};

describe('vesselCatalog', () => {
  beforeEach(() => {
    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.existsSync.mockReset();
    mockedFs.readdirSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockReturnValue([]);
  });

  it('loads catalog and merges mod entries', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['override.json', 'notes.txt']);
    mockedFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('catalog.json')) {
        return JSON.stringify([
          {
            id: 'starter-container',
            name: 'Starter',
            shipType: ShipType.CONTAINER,
            properties: {
              mass: 1,
              length: 2,
              beam: 3,
              draft: 4,
              blockCoefficient: 0.8,
              maxSpeed: 20,
            },
            hydrodynamics: { maxThrust: 100 },
            physics: {
              model: 'displacement',
              schemaVersion: 1,
              params: { drag: 1 },
            },
            commerce: { purchasePrice: 1000 },
            tags: ['base'],
          },
        ]);
      }
      return JSON.stringify({
        entries: [
          {
            id: 'starter-container',
            name: 'Starter Mk2',
            shipType: ShipType.CONTAINER,
            properties: {
              mass: 10,
              length: 2,
              beam: 3,
              draft: 4,
              blockCoefficient: 0.8,
              maxSpeed: 21,
            },
            hydrodynamics: { yawDamping: 2 },
            physics: {
              model: 'displacement',
              schemaVersion: 2,
              params: { lift: 3 },
            },
            commerce: { charterRatePerHour: 50 },
            tags: ['mod'],
          },
          {
            id: 'new-vessel',
            name: 'Mod Vessel',
            shipType: ShipType.CARGO,
            properties: {
              mass: 100,
              length: 20,
              beam: 8,
              draft: 5,
              blockCoefficient: 0.7,
              maxSpeed: 18,
            },
          },
        ],
      });
    });
    const { getVesselCatalog } = await loadCatalog();

    const catalog = getVesselCatalog();
    const mergedStarter = catalog.byId.get('starter-container');
    const modEntry = catalog.byId.get('new-vessel');

    expect(catalog.entries).toHaveLength(2);
    expect(mergedStarter).toEqual(
      expect.objectContaining({
        name: 'Starter Mk2',
        tags: ['mod'],
        commerce: expect.objectContaining({
          purchasePrice: 1000,
          charterRatePerHour: 50,
        }),
        hydrodynamics: expect.objectContaining({
          maxThrust: 100,
          yawDamping: 2,
        }),
        physics: expect.objectContaining({
          schemaVersion: 2,
          params: expect.objectContaining({ drag: 1, lift: 3 }),
        }),
      }),
    );
    expect(modEntry).toEqual(expect.objectContaining({ id: 'new-vessel' }));
  });

  it('returns cached catalog until ttl expires', async () => {
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify([
        {
          id: 'starter-container',
          name: 'Starter',
          shipType: ShipType.CONTAINER,
          properties: {
            mass: 1,
            length: 2,
            beam: 3,
            draft: 4,
            blockCoefficient: 0.8,
            maxSpeed: 20,
          },
        },
      ]),
    );
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(3_000)
      .mockReturnValueOnce(20_001);
    const { getVesselCatalog } = await loadCatalog();

    const first = getVesselCatalog();
    const second = getVesselCatalog();
    const third = getVesselCatalog();

    expect(second).toBe(first);
    expect(third).not.toBe(first);
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('resolves known template and falls back to hardcoded default', async () => {
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify([
        {
          id: 'starter-container',
          name: 'Starter',
          shipType: ShipType.CONTAINER,
          properties: {
            mass: 1,
            length: 2,
            beam: 3,
            draft: 4,
            blockCoefficient: 0.8,
            maxSpeed: 20,
          },
        },
      ]),
    );
    const moduleWithStarter = await loadCatalog();
    const starter =
      moduleWithStarter.resolveVesselTemplate('starter-container');
    const fallbackToStarter =
      moduleWithStarter.resolveVesselTemplate('unknown');

    expect(starter.id).toBe('starter-container');
    expect(fallbackToStarter.id).toBe('starter-container');

    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.existsSync.mockReset();
    mockedFs.readdirSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockReturnValue([]);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify([]));
    const moduleWithoutStarter = await loadCatalog();
    const hardcoded = moduleWithoutStarter.resolveVesselTemplate(null);

    expect(hardcoded).toEqual(
      expect.objectContaining({
        id: 'starter-container',
        shipType: ShipType.DEFAULT,
        name: 'Default Vessel',
      }),
    );
  });

  it('builds hydrodynamics by overlaying template values', async () => {
    const { buildHydrodynamics } = await loadCatalog();

    const hydro = buildHydrodynamics({
      id: 'v1',
      name: 'Custom',
      shipType: ShipType.CARGO,
      properties: {
        mass: 1000,
        length: 10,
        beam: 4,
        draft: 2,
        blockCoefficient: 0.7,
        maxSpeed: 12,
      },
      hydrodynamics: {
        maxThrust: 123,
      },
    });

    expect(hydro.maxThrust).toBe(123);
    expect(hydro.rudderMaxAngle).toBe(DEFAULT_HYDRO.rudderMaxAngle);
    expect(hydro.yawDampingQuad).toBe(DEFAULT_HYDRO.yawDampingQuad);
  });
});
