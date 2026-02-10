import { prisma } from '../lib/prisma';
import { getScenarios } from '../lib/scenarios';

export type CareerKey =
  | 'cargo'
  | 'pax'
  | 'sar'
  | 'salvage'
  | 'pilotage'
  | 'tug'
  | 'survey';

type CareerDefinition = {
  id: CareerKey;
  name: string;
  description: string;
  licenseKey: string;
};

type ExamDefinition = {
  id: string;
  name: string;
  description: string;
  scenarioId?: string;
  careerId: CareerKey;
  licenseKey: string;
  minScore: number;
};

export const CAREERS: CareerDefinition[] = [
  {
    id: 'cargo',
    name: 'Cargo Operations',
    description: 'Bulk, container, and port logistics handling.',
    licenseKey: 'cargo-master',
  },
  {
    id: 'pax',
    name: 'Passenger Operations',
    description: 'Ferries, water buses, and charter services.',
    licenseKey: 'pax-master',
  },
  {
    id: 'sar',
    name: 'Search & Rescue',
    description: 'Emergency response, towing, and recovery.',
    licenseKey: 'sar-certified',
  },
  {
    id: 'salvage',
    name: 'Salvage',
    description: 'Recovering grounded or damaged vessels.',
    licenseKey: 'salvage-certified',
  },
  {
    id: 'pilotage',
    name: 'Pilotage',
    description: 'Harbor entry, escort, and COLREG compliance.',
    licenseKey: 'pilotage-certified',
  },
  {
    id: 'tug',
    name: 'Tug & Tow',
    description: 'Towing contracts and precision maneuvers.',
    licenseKey: 'tug-certified',
  },
  {
    id: 'survey',
    name: 'Survey',
    description: 'Hydrographic and research data collection.',
    licenseKey: 'survey-certified',
  },
];

export const EXAMS: ExamDefinition[] = [
  {
    id: 'pilotage-harbor-entry',
    name: 'Harbor Entry Exam',
    description: 'Demonstrate safe harbor entry and docking.',
    scenarioId: 'harbor-entry',
    careerId: 'pilotage',
    licenseKey: 'pilotage-certified',
    minScore: 75,
  },
  {
    id: 'colregs-crossing',
    name: 'COLREGS Crossing Exam',
    description: 'Safe crossing and overtaking compliance.',
    scenarioId: 'colregs-crossing',
    careerId: 'pilotage',
    licenseKey: 'pilotage-certified',
    minScore: 80,
  },
  {
    id: 'heavy-weather',
    name: 'Heavy Weather Exam',
    description: 'Maintain control in heavy weather.',
    scenarioId: 'heavy-weather',
    careerId: 'sar',
    licenseKey: 'sar-certified',
    minScore: 80,
  },
];

export const seedCareerDefinitions = async () => {
  await prisma.careerPath.createMany({
    data: CAREERS.map(career => ({
      id: career.id,
      name: career.name,
      description: career.description,
    })),
    skipDuplicates: true,
  });
  await prisma.exam.createMany({
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
};

export const ensureUserCareers = async (userId: string) => {
  const existing = await prisma.userCareer.findMany({
    where: { userId },
    select: { careerId: true },
  });
  const existingIds = new Set(
    existing.map((row: { careerId: string }) => row.careerId),
  );
  const createData = CAREERS.filter(career => !existingIds.has(career.id)).map(
    career => ({
      userId,
      careerId: career.id,
      level: 1,
      experience: 0,
      active: career.id === 'cargo',
    }),
  );
  if (createData.length > 0) {
    await prisma.userCareer.createMany({ data: createData });
  }
};

export const getCareerDefinitions = () => CAREERS;

export const getExamDefinitions = () =>
  EXAMS.map(exam => ({
    ...exam,
    scenario:
      exam.scenarioId &&
      getScenarios().find(scenario => scenario.id === exam.scenarioId),
  }));

export const addCareerExperience = async (params: {
  userId: string;
  careerId: CareerKey;
  experience: number;
}) => {
  await ensureUserCareers(params.userId);
  const career = await prisma.userCareer.findUnique({
    where: {
      userId_careerId: { userId: params.userId, careerId: params.careerId },
    },
  });
  if (!career) return;
  const nextExperience = career.experience + params.experience;
  const nextLevel = Math.max(1, Math.floor(nextExperience / 1200) + 1);
  await prisma.userCareer.update({
    where: { id: career.id },
    data: { experience: nextExperience, level: nextLevel },
  });
};

export const bumpReputation = async (params: {
  userId: string;
  scopeType: 'port' | 'company' | 'region';
  scopeId: string;
  delta: number;
}) => {
  await prisma.reputation.upsert({
    where: {
      userId_scopeType_scopeId: {
        userId: params.userId,
        scopeType: params.scopeType,
        scopeId: params.scopeId,
      },
    },
    update: { value: { increment: params.delta } },
    create: {
      userId: params.userId,
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      value: params.delta,
    },
  });
};

export const issueLicense = async (params: {
  userId: string;
  licenseKey: string;
  durationDays: number;
}) => {
  const expiresAt = new Date(
    Date.now() + params.durationDays * 24 * 60 * 60 * 1000,
  );
  await prisma.license.create({
    data: {
      userId: params.userId,
      licenseKey: params.licenseKey,
      status: 'active',
      issuedAt: new Date(),
      expiresAt,
    },
  });
};
