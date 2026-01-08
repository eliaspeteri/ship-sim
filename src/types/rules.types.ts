export interface Rules {
  colregs?: boolean;
  collisionPenalty?: number;
  nearMissPenalty?: number;
  maxSpeed?: number;
  [key: string]: unknown;
}
