import { prismaMock } from '../lib/prismaMock';

const getScenariosMock = jest.fn();

jest.mock('../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

jest.mock('../../../src/lib/scenarios', () => ({
  getScenarios: () => getScenariosMock(),
}));

const loadCareers = async () => {
  jest.resetModules();
  return import('../../../src/server/careers');
};

describe('server/careers', () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach(group => {
      Object.values(group).forEach(fn => fn.mockReset());
    });
    getScenariosMock.mockReset();
    getScenariosMock.mockReturnValue([
      { id: 'harbor-entry', name: 'Harbor Entry Scenario' },
      { id: 'colregs-crossing', name: 'COLREGS Crossing Scenario' },
    ]);
  });

  it('seeds career and exam definitions', async () => {
    const { CAREERS, EXAMS, seedCareerDefinitions } = await loadCareers();

    await seedCareerDefinitions();

    expect(prismaMock.careerPath.createMany).toHaveBeenCalledWith({
      data: CAREERS.map(career => ({
        id: career.id,
        name: career.name,
        description: career.description,
      })),
      skipDuplicates: true,
    });
    expect(prismaMock.exam.createMany).toHaveBeenCalledWith({
      data: EXAMS.map(exam => ({
        id: exam.id,
        name: exam.name,
        description: exam.description,
        scenarioId: exam.scenarioId || null,
        careerId: exam.careerId,
        licenseKey: exam.licenseKey,
        minScore: exam.minScore,
        active: true,
      })),
      skipDuplicates: true,
    });
  });

  it('ensures user careers and only creates missing entries', async () => {
    prismaMock.userCareer.findMany.mockResolvedValue([{ careerId: 'cargo' }]);
    const { ensureUserCareers } = await loadCareers();

    await ensureUserCareers('u1');

    expect(prismaMock.userCareer.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { careerId: true },
    });
    expect(prismaMock.userCareer.createMany).toHaveBeenCalledTimes(1);
    const payload =
      prismaMock.userCareer.createMany.mock.calls[0]?.[0]?.data ?? [];
    expect(payload.length).toBeGreaterThan(0);
    expect(payload.some((row: any) => row.careerId === 'cargo')).toBe(false);
    expect(payload.some((row: any) => row.active)).toBe(false);

    prismaMock.userCareer.createMany.mockReset();
    prismaMock.userCareer.findMany.mockResolvedValue(
      ['cargo', 'pax', 'sar', 'salvage', 'pilotage', 'tug', 'survey'].map(
        careerId => ({ careerId }),
      ),
    );
    await ensureUserCareers('u1');
    expect(prismaMock.userCareer.createMany).not.toHaveBeenCalled();
  });

  it('returns definitions and hydrates exams with scenarios', async () => {
    const { CAREERS, EXAMS, getCareerDefinitions, getExamDefinitions } =
      await loadCareers();

    expect(getCareerDefinitions()).toBe(CAREERS);
    const exams = getExamDefinitions();
    expect(exams).toHaveLength(EXAMS.length);
    expect(exams[0]).toEqual(
      expect.objectContaining({
        id: 'pilotage-harbor-entry',
        scenario: expect.objectContaining({ id: 'harbor-entry' }),
      }),
    );
  });

  it('adds experience, bumps reputation and issues licenses', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    prismaMock.userCareer.findMany.mockResolvedValue([]);
    prismaMock.userCareer.findUnique.mockResolvedValue({
      id: 'career-1',
      experience: 1190,
    });
    const { addCareerExperience, bumpReputation, issueLicense } =
      await loadCareers();

    await addCareerExperience({
      userId: 'u1',
      careerId: 'cargo',
      experience: 50,
    });
    expect(prismaMock.userCareer.update).toHaveBeenCalledWith({
      where: { id: 'career-1' },
      data: { experience: 1240, level: 2 },
    });

    prismaMock.userCareer.update.mockReset();
    prismaMock.userCareer.findUnique.mockResolvedValue(null);
    await addCareerExperience({
      userId: 'u1',
      careerId: 'cargo',
      experience: 100,
    });
    expect(prismaMock.userCareer.update).not.toHaveBeenCalled();

    await bumpReputation({
      userId: 'u2',
      scopeType: 'port',
      scopeId: 'port-1',
      delta: 7,
    });
    expect(prismaMock.reputation.upsert).toHaveBeenCalledWith({
      where: {
        userId_scopeType_scopeId: {
          userId: 'u2',
          scopeType: 'port',
          scopeId: 'port-1',
        },
      },
      update: { value: { increment: 7 } },
      create: {
        userId: 'u2',
        scopeType: 'port',
        scopeId: 'port-1',
        value: 7,
      },
    });

    await issueLicense({
      userId: 'u3',
      licenseKey: 'pilotage-certified',
      durationDays: 2,
    });
    expect(prismaMock.license.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u3',
        licenseKey: 'pilotage-certified',
        status: 'active',
      }),
    });

    nowSpy.mockRestore();
  });
});
