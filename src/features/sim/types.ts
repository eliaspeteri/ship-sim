import type { Rules } from '../../types/rules.types';

export type SpaceSummary = {
  id: string;
  name: string;
  visibility: string;
  inviteToken?: string;
  rulesetType?: string;
  rules?: Rules | null;
};

export type SpaceFlow = 'choice' | 'join' | 'create';
