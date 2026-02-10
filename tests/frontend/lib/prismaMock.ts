const baseModel = () => ({
  findMany: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  createMany: jest.fn(),
  count: jest.fn(),
  groupBy: jest.fn(),
  aggregate: jest.fn(),
  upsert: jest.fn(),
});

export const prismaMock = {
  $transaction: jest.fn(),
  authEvent: {
    create: jest.fn(),
  },
  ban: {
    ...baseModel(),
  },
  mute: {
    ...baseModel(),
  },
  mission: {
    ...baseModel(),
  },
  missionAssignment: {
    ...baseModel(),
  },
  environmentEvent: {
    ...baseModel(),
  },
  passengerContract: {
    ...baseModel(),
  },
  weatherState: {
    ...baseModel(),
  },
  examAttempt: {
    ...baseModel(),
  },
  space: {
    ...baseModel(),
  },
  spaceAccess: {
    ...baseModel(),
  },
  user: {
    ...baseModel(),
  },
  economyTransaction: {
    ...baseModel(),
  },
  crewContract: {
    ...baseModel(),
  },
  loan: {
    ...baseModel(),
  },
  vessel: {
    ...baseModel(),
  },
  vesselSale: {
    ...baseModel(),
  },
  insurancePolicy: {
    ...baseModel(),
  },
  vesselLease: {
    ...baseModel(),
  },
  cargoLot: {
    ...baseModel(),
  },
  careerPath: {
    ...baseModel(),
  },
  exam: {
    ...baseModel(),
  },
  userCareer: {
    ...baseModel(),
  },
  reputation: {
    ...baseModel(),
  },
  license: {
    ...baseModel(),
  },
};
