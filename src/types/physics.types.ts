export type PhysicsModelKey =
  | 'displacement'
  | 'planing'
  | 'sailing'
  | 'tow_assist';

export type VesselPhysicsConfig = {
  model: PhysicsModelKey;
  schemaVersion: number;
  params?: Record<string, number>;
};
