export const prismaMock = {
  authEvent: {
    create: jest.fn(),
  },
  ban: {
    findMany: jest.fn(),
  },
  mute: {
    create: jest.fn(),
  },
  mission: {},
  missionAssignment: {},
  environmentEvent: {},
  passengerContract: {},
  weatherState: {},
  examAttempt: {},
  space: {},
  spaceAccess: {},
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  economyTransaction: {
    create: jest.fn(),
  },
  crewContract: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
  loan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  vessel: {},
  vesselSale: {
    create: jest.fn(),
  },
  insurancePolicy: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  vesselLease: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  cargoLot: {
    findMany: jest.fn(),
  },
  careerPath: {
    createMany: jest.fn(),
  },
  exam: {
    createMany: jest.fn(),
  },
  userCareer: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  reputation: {
    upsert: jest.fn(),
  },
  license: {
    create: jest.fn(),
  },
};
