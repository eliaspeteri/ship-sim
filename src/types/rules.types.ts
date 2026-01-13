export enum RulesetType {
  CASUAL = 'CASUAL',
  REALISM = 'REALISM',
  CUSTOM = 'CUSTOM',
  EXAM = 'EXAM',
}

export const mapToRulesetType = (type: string): RulesetType => {
  switch (type) {
    case 'CASUAL':
    case 'CASUAL_PUBLIC':
      return RulesetType.CASUAL;
    case 'REALISM':
    case 'SIM_PUBLIC':
      return RulesetType.REALISM;
    case 'CUSTOM':
    case 'PRIVATE_SANDBOX':
      return RulesetType.CUSTOM;
    case 'EXAM':
    case 'TRAINING_EXAM':
      return RulesetType.EXAM;
    default:
      return RulesetType.CASUAL;
  }
};

export interface Rules {
  type: RulesetType;
  assists: {
    stability: boolean;
    autopilot: boolean;
    docking: boolean;
  };
  realism: {
    damage: boolean;
    wear: boolean;
    failures: boolean;
  };
  enforcement: {
    colregs: boolean;
    penalties: boolean;
    investigations: boolean;
  };
  hudLimitations: Record<string, unknown>; // placeholder
  allowedVessels: string[];
  allowedMods: string[];
  progression: {
    scoring: boolean;
  };
  // legacy
  colregs?: boolean;
  collisionPenalty?: number;
  nearMissPenalty?: number;
  maxSpeed?: number;
  [key: string]: unknown;
}

export const getDefaultRules = (type: RulesetType): Rules => {
  switch (type) {
    case RulesetType.CASUAL:
      return {
        type: RulesetType.CASUAL,
        assists: { stability: true, autopilot: true, docking: true },
        realism: { damage: false, wear: false, failures: false },
        enforcement: {
          colregs: false,
          penalties: false,
          investigations: false,
        },
        hudLimitations: {},
        allowedVessels: [],
        allowedMods: [],
        progression: { scoring: false },
      };
    case RulesetType.REALISM:
      return {
        type: RulesetType.REALISM,
        assists: { stability: false, autopilot: false, docking: false },
        realism: { damage: true, wear: true, failures: true },
        enforcement: { colregs: true, penalties: true, investigations: true },
        hudLimitations: {},
        allowedVessels: [],
        allowedMods: [],
        progression: { scoring: true },
      };
    case RulesetType.CUSTOM:
      return {
        type: RulesetType.CUSTOM,
        assists: { stability: true, autopilot: true, docking: true },
        realism: { damage: false, wear: false, failures: false },
        enforcement: {
          colregs: false,
          penalties: false,
          investigations: false,
        },
        hudLimitations: {},
        allowedVessels: [],
        allowedMods: [],
        progression: { scoring: false },
      };
    case RulesetType.EXAM:
      return {
        type: RulesetType.EXAM,
        assists: { stability: false, autopilot: false, docking: false },
        realism: { damage: true, wear: false, failures: true },
        enforcement: { colregs: true, penalties: true, investigations: true },
        hudLimitations: {},
        allowedVessels: ['fixed'],
        allowedMods: [],
        progression: { scoring: true },
      };
    default:
      throw new Error(`Unexpected ruleset type: ${type}`);
  }
};
