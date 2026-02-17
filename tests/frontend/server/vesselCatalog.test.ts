import fs from 'fs';

import { DEFAULT_HYDRO } from '../../../src/constants/vessel';
import { ShipType } from '../../../src/types/vessel.types';

jest.mock('fs', () => {
  const promises = {
    readFile: jest.fn(),
    readdir: jest.fn(),
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
    readdir: jest.Mock;
  };
};
let mockedFs = fs as unknown as MockedFs;

const loadCatalog = async () => import('../../../src/server/vesselCatalog');

describe('vesselCatalog', () => {
  beforeEach(() => {
    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.promises.readFile.mockReset();
    mockedFs.promises.readdir.mockReset();
    mockedFs.promises.readdir.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );
  });

  it('loads catalog and merges mod entries', async () => {
    mockedFs.promises.readdir.mockResolvedValue(['override.json', 'notes.txt']);
    mockedFs.promises.readFile.mockImplementation((filePath: string) => {
      if (filePath.includes('catalog.json')) {
        return Promise.resolve(
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
              hydrodynamics: { maxThrust: 100 },
              physics: {
                model: 'displacement',
                schemaVersion: 1,
                params: { drag: 1 },
              },
              commerce: { purchasePrice: 1000 },
              tags: ['base'],
            },
          ]),
        );
      }
      return Promise.resolve(
        JSON.stringify({
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
        }),
      );
    });
    const { getVesselCatalog, warmVesselCatalog } = await loadCatalog();
    await warmVesselCatalog();

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

  it('serves cached catalog and refreshes asynchronously after ttl', async () => {
    mockedFs.promises.readFile
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            id: 'starter-container',
            name: 'Starter v2',
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

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);
    const { getVesselCatalog, warmVesselCatalog } = await loadCatalog();
    await warmVesselCatalog();
    const first = getVesselCatalog();
    expect(first.byId.get('starter-container')?.name).toBe('Starter');

    nowSpy.mockReturnValue(20_500);
    const staleRead = getVesselCatalog();
    expect(staleRead.byId.get('starter-container')?.name).toBe('Starter');

    await warmVesselCatalog();
    const refreshed = getVesselCatalog();
    expect(refreshed.byId.get('starter-container')?.name).toBe('Starter v2');
    expect(mockedFs.promises.readFile).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('resolves known template and falls back to hardcoded default', async () => {
    mockedFs.promises.readFile.mockResolvedValue(
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
    await moduleWithStarter.warmVesselCatalog();
    const starter =
      moduleWithStarter.resolveVesselTemplate('starter-container');
    const fallbackToStarter =
      moduleWithStarter.resolveVesselTemplate('unknown');

    expect(starter.id).toBe('starter-container');
    expect(fallbackToStarter.id).toBe('starter-container');

    jest.resetModules();
    mockedFs = jest.requireMock('fs') as MockedFs;
    mockedFs.promises.readFile.mockReset();
    mockedFs.promises.readdir.mockReset();
    mockedFs.promises.readdir.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );
    mockedFs.promises.readFile.mockResolvedValue(JSON.stringify([]));

    const moduleWithoutStarter = await loadCatalog();
    await moduleWithoutStarter.warmVesselCatalog();
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
