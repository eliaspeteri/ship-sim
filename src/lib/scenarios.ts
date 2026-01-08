import { positionFromXY } from './position';

export type ScenarioDefinition = {
  id: string;
  name: string;
  description: string;
  spawn: { lat: number; lon: number; z: number };
  weatherPattern?: string;
  environmentOverrides?: Record<string, unknown>;
  rules: {
    colregs: boolean;
    collisionPenalty: number;
    nearMissPenalty: number;
    maxSpeed?: number;
  };
  rankRequired: number;
};

const scenarios: ScenarioDefinition[] = [
  {
    id: 'harbor-entry',
    name: 'Harbor Entry',
    description: 'Navigate a narrow approach and dock without violations.',
    spawn: positionFromXY({ x: -600, y: -900, z: 0 }),
    weatherPattern: 'calm',
    rules: {
      colregs: true,
      collisionPenalty: 400,
      nearMissPenalty: 120,
      maxSpeed: 8,
    },
    rankRequired: 1,
  },
  {
    id: 'colregs-crossing',
    name: 'COLREGS Crossing',
    description: 'Practice crossing and overtaking in moderate traffic.',
    spawn: positionFromXY({ x: 1200, y: 400, z: 0 }),
    weatherPattern: 'moderate',
    rules: {
      colregs: true,
      collisionPenalty: 600,
      nearMissPenalty: 200,
      maxSpeed: 12,
    },
    rankRequired: 2,
  },
  {
    id: 'heavy-weather',
    name: 'Heavy Weather Escort',
    description: 'Maintain control in storm conditions.',
    spawn: positionFromXY({ x: -1500, y: 1600, z: 0 }),
    weatherPattern: 'stormy',
    rules: {
      colregs: true,
      collisionPenalty: 800,
      nearMissPenalty: 240,
      maxSpeed: 10,
    },
    rankRequired: 3,
  },
];

export const getScenarios = () => scenarios;
