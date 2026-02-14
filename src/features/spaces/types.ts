import type { Rules } from '../../types/rules.types';

export type SpaceVisibility = 'public' | 'private';

export type ManagedSpace = {
  id: string;
  name: string;
  visibility: SpaceVisibility;
  inviteToken?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  passwordProtected?: boolean;
  totalVessels?: number;
  activeVessels?: number;
  rulesetType?: string;
  rules?: Rules | null;
};

export type SpaceDraft = {
  name: string;
  visibility: SpaceVisibility;
  rulesetType: string;
  rules: Rules | null;
  password: string;
  saving?: boolean;
  rulesTouched?: boolean;
  error?: string | null;
};
