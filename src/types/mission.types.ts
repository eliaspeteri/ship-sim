export type MissionType = 'delivery' | 'towing' | 'harbor-entry';

export interface MissionDefinition {
  id: string;
  spaceId: string;
  name: string;
  description?: string | null;
  type: MissionType;
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
  rewardCredits: number;
  requiredRank: number;
  payload?: Record<string, unknown> | null;
  active: boolean;
  createdBy?: string | null;
}

export interface MissionProgress {
  stage: 'pickup' | 'delivery';
  lastDistance?: number;
  pickedUpAt?: number;
}

export interface MissionAssignmentData {
  id: string;
  missionId: string;
  userId: string;
  vesselId?: string | null;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  progress?: MissionProgress | null;
  startedAt?: string;
  completedAt?: string | null;
  mission?: MissionDefinition;
}
